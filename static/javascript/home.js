// Define global variables so all functions can access them
const video = document.getElementById("video");
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); // Get the 2D drawing context

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });
    video.srcObject = stream;

    // Wait for the video metadata to load so videoWidth/height are available
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function startMoveNet() {
    // Start camera and wait for it to be ready
    await startCamera();
    
    // Explicitly play the video
    video.play();

    // Create MoveNet detector
    const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
    );

    return detector;
}

function drawResult(pose) {
    // Clear the canvas using the correct context variable
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pose) return;

    // Draw keypoints
    for (const keypoint of pose.keypoints) {
        if (keypoint.score > 0.3) {
            ctx.fillStyle = 'Aqua';
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Draw skeleton connections
    const adjacentPairs = poseDetection.util.getAdjacentPairs(
        poseDetection.SupportedModels.MoveNet
    );
    for (const [i, j] of adjacentPairs) {
        const kp1 = pose.keypoints[i];
        const kp2 = pose.keypoints[j];
        if (kp1.score > 0.3 && kp2.score > 0.3) {
            ctx.strokeStyle = 'Lime';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    }
}

async function render(detector) {
    // Set canvas dimensions to match the incoming webcam feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Continuously estimate poses from the live video element
    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) {
        drawResult(poses[0]);
    }
    
    // Loop the render loop on the next animation frame
    requestAnimationFrame(() => render(detector));
}

// Create an entry point to handle the async setup safely
async function main() {
    try {
        const detector = await startMoveNet();
        render(detector); // Pass the resolved detector into the loop
    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

// Run the application
main();

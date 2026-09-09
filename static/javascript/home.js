// Dictionary that maps from joint names to keypoint indices (src: https://github.com/tensorflow/docs/blob/master/site/en/hub/tutorials/movenet.ipynb).
// KEYPOINT_DICT = {
//     'nose': 0,
//     'left_eye': 1,
//     'right_eye': 2,
//     'left_ear': 3,
//     'right_ear': 4,
//     'left_shoulder': 5,
//     'right_shoulder': 6,
//     'left_elbow': 7,
//     'right_elbow': 8,
//     'left_wrist': 9,
//     'right_wrist': 10,
//     'left_hip': 11,
//     'right_hip': 12,
//     'left_knee': 13,
//     'right_knee': 14,
//     'left_ankle': 15,
//     'right_ankle': 16
// }

// ----------------------------------------
// MoveNet Functionality and Rendering
// ----------------------------------------

// Camera Display Variables
const video = document.getElementById("video");
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); // Get the 2D drawing context

var cameraStream;
var animationStopID;

// MoveNet Variables
var isTrackingActive = false;


async function startCamera() {
    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });
    video.srcObject = cameraStream;

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
    
    if (pose == null) 
        return;

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
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
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
    
    const poses = await detector.estimatePoses(video);

    // Continuously estimate poses from the live video element
    if (poses.length > 0) {
        const pose = poses[0];

        drawResult(pose);
        angleOfArm(pose);
    }
    
    if(isTrackingActive){
        animationStopID = requestAnimationFrame(() => render(detector));
    }
    // Loop the render loop on the next animation frame
}


// Function that turns on and off the MoveNet tracking
async function toggleCameraTracking(){
    if(isTrackingActive){
        console.log("Stopped Tracking");
        isTrackingActive = false;
        await stopCameraTracking();
    }
    else{
        console.log("Started Tracking");
        isTrackingActive = true;
        await startCameraTracking();
    }

    console.log(isTrackingActive);
}

// Create an entry point to handle the async setup safely
async function startCameraTracking() {
    try {
        const detector = await startMoveNet();

        render(detector); 
        
    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

async function stopCameraTracking(){
    cancelAnimationFrame(animationStopID);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cameraStream == null)
        return;

    const tracks = cameraStream.getTracks();

    tracks.forEach(track => {
        track.stop();
    })

    video.srcObject = null;
    cameraStream = null;
}

// ----------------------------------------
// Body Evaluation
// ----------------------------------------

async function angleOfArm(pose){
    const left_elbow = pose.keypoints[7];
    const left_wrist = pose.keypoints[9];

    const dir_x = left_elbow.x - left_wrist.x;
    const dir_y = left_elbow.y - left_wrist.y;

    const angle = Math.atan2(dir_y, dir_x) * (180 / Math.PI)

    console.log(angle);
}

// ----------------------------------------
// Camera Toggle
// ----------------------------------------

const cameraBtn = document.getElementById("toggle-camera")

cameraBtn.addEventListener("click", toggleCameraTracking)


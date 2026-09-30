// ----------------------------------------
// Dictionary Data
// ----------------------------------------

// Dictionary that maps from joint names to keypoint indices (src: https://github.com/tensorflow/docs/blob/master/site/en/hub/tutorials/movenet.ipynb).
const KEYPOINT_DICT = {
    'left_shoulder': 5,
    'right_shoulder': 6,
    'left_elbow': 7,
    'right_elbow': 8,
    'left_wrist': 9,
    'right_wrist': 10,
    'left_hip': 11,
    'right_hip': 12,
    'left_knee': 13,
    'right_knee': 14,
    'left_ankle': 15,
    'right_ankle': 16
}

const sitToStandLimbAngles = {
    timeBetween: 3,

    sitAngles: {

        // -------------------------
        // SHOULDERS / COLLAR
        // -------------------------

        collar: {
            joint1: "left_shoulder",
            joint2: "right_shoulder",
            minAngle: 345,
            maxAngle: 15,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        // -------------------------
        // LEFT ARM
        // Hands should be straight in front
        // -------------------------

        leftUpperArm: {
            joint1: "left_shoulder",
            joint2: "left_elbow",
            minAngle: 265,
            maxAngle: 305,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },
        leftLowerArm: {
            joint1: "left_elbow",
            joint2: "left_wrist",
            minAngle: 20,
            maxAngle: 50,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        // -------------------------
        // RIGHT ARM
        // Hands should be straight in front
        // -------------------------

        rightUpperArm: {
            joint1: "right_shoulder",
            joint2: "right_elbow",
            minAngle: 245,
            maxAngle: 285,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },
        rightLowerArm: {
            joint1: "right_elbow",
            joint2: "right_wrist",
            minAngle: 120,
            maxAngle: 150,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        // -------------------------
        // LEFT LEG
        // -------------------------

        leftThigh: {
            joint1: "left_hip",
            joint2: "left_knee",
            minAngle: 240,
            maxAngle: 270,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        leftCalf: {
            joint1: "left_ankle",
            joint2: "left_knee",
            minAngle: 80,
            maxAngle: 110,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        // -------------------------
        // RIGHT LEG
        // -------------------------

        rightThigh: {
            joint1: "right_knee",
            joint2: "right_hip",
            minAngle: 85,
            maxAngle: 125,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        rightCalf: {
            joint1: "right_ankle",
            joint2: "right_knee",
            minAngle: 80,
            maxAngle: 110,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        // -------------------------
        // TORSO & HIPS
        // -------------------------

        leftTorso: {
            joint1: "left_hip",
            joint2: "left_shoulder",
            minAngle: 45,
            maxAngle: 100,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        rightTorso: {
            joint1: "right_hip",
            joint2: "right_shoulder",
            minAngle: 45,
            maxAngle: 100,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        },

        hipLine: {
            joint1: "left_hip",
            joint2: "right_hip",
            minAngle: 345,
            maxAngle: 15,
            minDistance: null,
            maxDistance: null,
            withinAngleThreshold: false,
            withinDistanceThreshold: false,
        }
    },

    standingAngles: {}

};

const currentTest = sitToStandLimbAngles

// ----------------------------------------
// Variables
// ----------------------------------------

// Camera Display Variables
const video = document.getElementById("video");
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); // Get the 2D drawing context

var cameraStream;
var animationStopID;

// MoveNet Variables
var isTrackingActive = false;

// ----------------------------------------
// Camera & MoveNet Setup
// ----------------------------------------

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
        startTracking(detector); 
        
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
// MoveNet Tracking & Rendering
// ----------------------------------------

async function startTracking(detector) {
    // Set canvas dimensions to match the incoming webcam feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const poses = await detector.estimatePoses(video);

    // Continuously estimate poses from the live video element
    if (poses.length > 0) {
        const pose = poses[0];

        runFunctionalTests(pose);
        render(pose);
    }
    
    if(isTrackingActive){
        animationStopID = requestAnimationFrame(() => startTracking(detector));
    }
    // Loop the render loop on the next animation frame
}

function render(pose) {
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

        Object.values(currentTest.sitAngles).forEach(limb => {
        const kp1 = pose.keypoints[KEYPOINT_DICT[limb.joint1]];
        const kp2 = pose.keypoints[KEYPOINT_DICT[limb.joint2]];

        if (kp1.score > 0.3 && kp2.score > 0.3) {
            let withinThreshold;

            if ((limb.minDistance != null || limb.maxDistance != null) && limb.withinDistanceThreshold)
                withinThreshold = true;
            else
                withinThreshold = limb.withinAngleThreshold;
            
            
            if (withinThreshold)
                ctx.strokeStyle = 'Lime';
            else
                ctx.strokeStyle = 'Red';

            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    })
}

// ----------------------------------------
// Body Evaluation & Tests
// ----------------------------------------

function determineLimbAngle(pose1, pose2, minAngle, maxAngle){
    const dir_x = pose1.x - pose2.x;
    const dir_y = pose1.y - pose2.y;

    // Return angle in degrees, from 0 - 360
    const angle = (Math.atan2(dir_y, dir_x) * (180 / Math.PI) + 360) % 360;

    // Debug specific limb angles
    if(pose1.name == "left_shoulder" && pose2.name == "right_shoulder")
       console.log(`normal angle: ${angle}`);

    let withinThreshold;

    if (minAngle < maxAngle)
        withinThreshold = angle > minAngle && angle < maxAngle;
    else
        withinThreshold = angle > minAngle || angle < maxAngle;

    if (withinThreshold)
        return angle;

    return null;
}

function determineLimbDistance(pose1, pose2) {
    const dx = pose1.x - pose2.x;
    const dy = pose1.y - pose2.y;

    return Math.sqrt(dx * dx + dy * dy);
}

// ----------------------------------------
// Functional Test Code
// ----------------------------------------

function runFunctionalTests(pose){
    sitToStandTest(pose);
}

// ----------------------------------------
// 30 Second Sit To Stand Test
// ----------------------------------------

function sitToStandTest(pose){
    Object.values(currentTest.sitAngles).forEach(limb => {
        // Reset Threshold Flags
        limb.withinAngleThreshold = false;
        limb.withinDistanceThreshold = false;

        // Identify joints to be analysed
        const joint1 = pose.keypoints[KEYPOINT_DICT[limb.joint1]];
        const joint2 = pose.keypoints[KEYPOINT_DICT[limb.joint2]];

        // Check if the limb measures joint distance
        // If it does, don't compute angle check
        if (limb.minDistance != null || limb.maxDistance != null){
            const limbDistance = determineLimbDistance(joint1, joint2);

            if (limbDistance > limb.minDistance && limbDistance < limb.maxDistance)
                limb.withinDistanceThreshold = true;

            //return;
        }

        const minAngle = limb.minAngle;
        const maxAngle = limb.maxAngle;    
        
        const limbAngle = determineLimbAngle(joint1, joint2, minAngle, maxAngle)
        
        if (limbAngle != null){
            limb.withinAngleThreshold = true;
        }
    })
}

// ----------------------------------------
// Camera Toggle & Event Listeners
// ----------------------------------------

const cameraBtn = document.getElementById("toggle-camera")

cameraBtn.addEventListener("click", toggleCameraTracking)


// To Do: 
//
// #Create dynamic detection of limb angle threshold
// #1.1 Create main dictionary that is swapped between sit and stand phases of test
// #1.2 Ensure this dictionary has the key pairs as the key for the dictionary
// #1.3 Use this dictionary to detect the threshold
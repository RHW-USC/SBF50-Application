// Required Moduels for HandLandmarker to function
import {
    FilesetResolver,
    HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";

// ----------------------------------------
// Dictionary Data
// ----------------------------------------

// Maps each joint name to its corresponding landmark index in MediaPipe Pose output.
const KEYPOINT_DICT = {
    'nose': 0,
    'left_eye_inner': 1,
    'left_eye': 2,
    'left_eye_outer': 3,
    'right_eye_inner': 4,
    'right_eye': 5,
    'right_eye_outer': 6,
    'left_ear': 7,
    'right_ear': 8,
    'mouth_left': 9,
    'mouth_right': 10,
    'left_shoulder': 11,
    'right_shoulder': 12,
    'left_elbow': 13,
    'right_elbow': 14,
    'left_wrist': 15,
    'right_wrist': 16,
    'left_pinky': 17,
    'right_pinky': 18,
    'left_index': 19,
    'right_index': 20,
    'left_thumb': 21,
    'right_thumb': 22,
    'left_hip': 23,
    'right_hip': 24,
    'left_knee': 25,
    'right_knee': 26,
    'left_ankle': 27,
    'right_ankle': 28,
    'left_heel': 29,
    'right_heel': 30,
    'left_foot_index': 31,
    'right_foot_index': 32
};

// Maps each joint name to its corresponding landmark index in the Hand Landmarker output.
const HAND_DETECTOR_DICT = {
    'WRIST': 0,
    'THUMB_CMC': 1,
    'THUMB_MCP': 2,
    'THUMB_IP': 3,
    'THUMB_TIP': 4,
    'INDEX_FINGER_MCP': 5,
    'INDEX_FINGER_PIP': 6,
    'INDEX_FINGER_DIP': 7,
    'INDEX_FINGER_TIP': 8,
    'MIDDLE_FINGER_MCP': 9,
    'MIDDLE_FINGER_PIP': 10,
    'MIDDLE_FINGER_DIP': 11,
    'MIDDLE_FINGER_TIP': 12,
    'RING_FINGER_MCP': 13,
    'RING_FINGER_PIP': 14,
    'RING_FINGER_DIP': 15,
    'RING_FINGER_TIP': 16,
    'PINKY_MCP': 17,
    'PINKY_PIP': 18,
    'PINKY_DIP': 19,
    'PINKY_TIP': 20,
}

import { sitToStandAngles } from "./test_limb_parameters/sit_to_stand_angles.js";
import { fingerTipToFloorAngles } from "./test_limb_parameters/finger_to_floor_angles.js";
import { mcGillCoreEnduranceAngles } from "./test_limb_parameters/mcgill_core_endurance_angles.js";

// ----------------------------------------
// Variables
// ----------------------------------------

// References used to display the live camera feed and draw the pose overlay.
const video = document.getElementById("video");
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); // Get the 2D drawing context

let cameraStream;
let animationStopID;

let trackHands = false;

let patientHeight = 1854.2;

// Tracks whether pose detection is currently running.
let isTrackingActive = false;
let isUserInPosition = false;

// Sit to Stand Variables
let sitToStandPhase = Object.keys(sitToStandAngles)[0]// Logs current phase of test (i.e., is user meant to be sitting, or standing)

// Finger to Floor variables
let currentFTFScore = Infinity;

// McGill Core Endurance Variables
let mcgillTestInterval;


// ----------------------------------------
// Camera & MediaPipe Pose Setup
// ----------------------------------------

// Requests webcam access and resolves once the video dimensions are available.
async function startCamera() {
    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });
    video.srcObject = cameraStream;

    // Wait for video metadata so the video dimensions are available.
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadMediaPipePose() {
    if (typeof Pose !== 'undefined')
        return;

    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function startMediaPipePose() {
    // Request camera access and wait until the video is ready.
    await startCamera();

    // Start video playback so camera frames can be processed.
    await video.play();

    // Create a MediaPipe Pose detector.
    await loadMediaPipePose();
    const detector = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    
    detector.setOptions({ 
        modelComplexity: 0, 
        smoothLandmarks: true, 
        enableSegmentation: false, 
        minDetectionConfidence: 0.3, 
        minTrackingConfidence: 0.3 });

    detector.currentPose = null;

    detector.onResults((results) => {
        detector.currentPose = results.poseLandmarks ? { keypoints: results.poseLandmarks.map(landmark => ({ x: landmark.x * canvas.width, y: landmark.y * canvas.height, score: landmark.visibility ?? 0 })) } : null;
    });

    return detector;
}

async function createHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const options = {
        baseOptions: {
            modelAssetPath: "/static/models/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        numHands: 2
    };

    return await HandLandmarker.createFromOptions(vision, options);
}

// Toggles pose tracking and starts or stops the camera accordingly.
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

// Initializes the detector and starts tracking, handling setup errors.
async function startCameraTracking() {
    try {
        const detector = await startMediaPipePose();
        const handLandmarker = await createHandLandmarker()
        startTracking(detector, handLandmarker); 

    } catch (error) {
        console.error("Initialization failed:", error);
        isTrackingActive = false;
    }
}

// Stops the animation loop, clears the overlay, and releases the camera tracks.
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
// MediaPipe Pose Tracking & Rendering
// ----------------------------------------

async function startTracking(detector, handLandmarker) {
    if (!isTrackingActive)
        return;

    // Match the drawing canvas dimensions to the camera video.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Process the current camera frame using MediaPipe Pose.
    await detector.send({ image: video });

    const pose = detector.currentPose;

    // Process the same camera frame using MediaPipe Hand Landmarker.
    const handResult = handLandmarker.detectForVideo(
        video,
        performance.now()
    );

    // Render the body and hands together on the same canvas.
    if (pose != null) {
        runFunctionalTests(pose, handResult);
        render(pose, handResult);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Still render hands if body pose detection fails.
        renderHands(handResult);
    }

    if (isTrackingActive) {
        animationStopID = requestAnimationFrame(
            () => startTracking(detector, handLandmarker)
        );
    }
}

function render(pose, handResult) {
    // Clear the previous frame before drawing the current pose.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pose == null)
        return;

    // Select the correct test configuration.
    const s = state();
    let limbs;

    if (s.test == 'sit-to-stand') {
        trackHands = false;
        limbs = sitToStandAngles[sitToStandPhase];
    } else if (s.test == 'finger-to-floor') {
        trackHands = true;
        limbs = fingerTipToFloorAngles;
    } else if (s.test == 'core-endurance') {
        trackHands = false;
        limbs = mcGillCoreEnduranceAngles;
    } else {
        limbs = null;
    }

    // Draw the existing body limb connections.
    if (limbs) {
        Object.values(limbs).forEach(limb => {
            const kp1 = pose.keypoints[KEYPOINT_DICT[limb.joint1]];
            const kp2 = pose.keypoints[KEYPOINT_DICT[limb.joint2]];

            if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
                ctx.fillStyle = 'Aqua';
                ctx.beginPath();
                ctx.arc(kp1.x, kp1.y, 5, 0, 2 * Math.PI);
                ctx.arc(kp2.x, kp2.y, 5, 0, 2 * Math.PI);
                ctx.fill();

                let withinThreshold;

                if (limb.minDistance != null || limb.maxDistance != null)
                    withinThreshold = limb.withinDistanceThreshold;
                else
                    withinThreshold = limb.withinAngleThreshold;

                ctx.strokeStyle = withinThreshold ? 'Lime' : 'Red';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });
    }

    if (trackHands)
    // Draw the hand overlay on top of the body overlay.
        renderHands(handResult);
}

// Connections between the 21 MediaPipe hand landmarks.
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
];

function renderHands(handResult) {
    if (!handResult || !handResult.landmarks)
        return;

    // Draw every detected hand.
    for (const hand of handResult.landmarks) {

        // Draw connections between hand landmarks.
        ctx.strokeStyle = 'Lime';
        ctx.lineWidth = 3;

        for (const [startIndex, endIndex] of HAND_CONNECTIONS) {
            const start = hand[startIndex];
            const end = hand[endIndex];

            if (!start || !end)
                continue;

            ctx.beginPath();
            ctx.moveTo(
                start.x * canvas.width,
                start.y * canvas.height
            );
            ctx.lineTo(
                end.x * canvas.width,
                end.y * canvas.height
            );
            ctx.stroke();
        }

        // Draw all 21 landmarks, including the index fingertip.
        for (let i = 0; i < hand.length; i++) {
            const landmark = hand[i];

            const x = landmark.x * canvas.width;
            const y = landmark.y * canvas.height;

            // Highlight the index fingertip (landmark 8).
            ctx.fillStyle = 'Cyan'

            const fingertips = [4, 8, 12, 16, 20]
            if (fingertips.includes(i)){
                ctx.beginPath();
                ctx.arc(
                    x,
                    y,
                    5,
                    0,
                    2 * Math.PI
                );
            }
            ctx.fill();
        }
    }
}

// ----------------------------------------
// Body Evaluation & Tests
// ----------------------------------------

// Calculates the angle between two keypoints and checks whether it falls within the configured range.
function determineLimbAngle(pose1, pose2, minAngle, maxAngle){
    const dir_x = pose1.x - pose2.x;
    const dir_y = pose1.y - pose2.y;

    // Convert the direction between the points to an angle from 0 to 360 degrees.
    const angle = (Math.atan2(dir_y, dir_x) * (180 / Math.PI) + 360) % 360;

    let withinThreshold;

    if (minAngle < maxAngle)
        withinThreshold = angle >= minAngle && angle <= maxAngle;
    else
        withinThreshold = angle >= minAngle || angle <= maxAngle;

    if (withinThreshold)
        return angle;

    return null;
}

// Calculates the straight-line pixel distance between two keypoints.
function determineLimbDistance(pose1, pose2) {
    const dx = pose1.x - pose2.x;
    const dy = pose1.y - pose2.y;

    return Math.sqrt(dx * dx + dy * dy);
}

// Advances to the next phase and wraps back to the first phase when needed.
function cycleTestPhase(phaseLog, limbAngles){
    const totalPhases = Object.keys(limbAngles);
    const currentPhase = totalPhases.indexOf(phaseLog);

    const newPhase = totalPhases[(currentPhase + 1) % totalPhases.length];

    return newPhase
}

// ----------------------------------------
// Functional Test Code
// ----------------------------------------

// Runs the evaluation function that matches the currently selected test.
function runFunctionalTests(pose, handResult){
    if (isTestActive){
        const s = state();

        if (s.test == 'sit-to-stand')
            sitToStandTest(pose);
        else if (s.test == 'finger-to-floor')
            fingerTipToFloorTest(pose, handResult);
        else if(s.test == 'core-endurance')
            mcGillCoreEndurance(pose);
    }
}

function functionalTest(pose, currentTest){
    let limbThresholds = {};

    Object.values(currentTest).forEach(limb => {
        limbThresholds[`${limb.joint1} - ${limb.joint2}`] = false;

        // Reset Threshold Flags
        limb.withinAngleThreshold = false;
        limb.withinDistanceThreshold = false;

        // Identify joints to be analysed
        const joint1 = pose.keypoints[KEYPOINT_DICT[limb.joint1]];
        const joint2 = pose.keypoints[KEYPOINT_DICT[limb.joint2]];

        if (!joint1 || !joint2 || joint1.score <= 0.3 || joint2.score <= 0.3) {
            return;
        }

        // Check if the limb measures joint distance
        // If it does, don't compute angle check
        if (limb.minDistance != null || limb.maxDistance != null){
            const limbDistance = determineLimbDistance(joint1, joint2);

            if (limbDistance > limb.minDistance && limbDistance < limb.maxDistance){
                limb.withinDistanceThreshold = true;
                limbThresholds[`${limb.joint1} - ${limb.joint2}`] = true;
            }
        }
        else 
        {
            const minAngle = limb.minAngle;
            const maxAngle = limb.maxAngle;    

            const limbAngle = determineLimbAngle(joint1, joint2, minAngle, maxAngle)

            if (limb.joint1 == "left_shoulder" && limb.joint2 == "left_elbow")
                console.log(`${limb.joint1} - ${limb.joint2}: ${determineLimbAngle(joint1, joint2, 0, 360)}`);

            if (limbAngle != null){
                limb.withinAngleThreshold = true;
                limbThresholds[`${limb.joint1} - ${limb.joint2}`] = true;
            }

            // if(joint1.name == "left_hip" && joint2.name == "left_knee" ){
            //     console.log("I have been triggered incorrectly");
            // }
        }
    })

    return limbThresholds;
}

// ----------------------------------------
// 30 Second Sit To Stand Test
// ----------------------------------------

// Checks the required limb positions for the active sit-to-stand phase.
function sitToStandTest(pose){
    const currentTest = sitToStandAngles[sitToStandPhase];
    const limbThresholds = functionalTest(pose, currentTest);

    isUserInPosition = Object.values(limbThresholds).every(limb => limb === true);

    if (isUserInPosition && Object.keys(limbThresholds).length > 0){
        if (sitToStandPhase == Object.keys(sitToStandAngles)[1]){
            points++;
            console.log(points)
            isUserInPosition = false;
        }

        sitToStandPhase = cycleTestPhase(sitToStandPhase, sitToStandAngles)
    }
}

// ----------------------------------------
// Fingertip to Floor Test
// ----------------------------------------

// Evaluates the configured joint positions and records wrist-to-ankle distance.
function fingerTipToFloorTest(pose, handResult) {
    if (!handResult || !handResult.landmarks || handResult.landmarks.length === 0)
        return;

    const nose = pose.keypoints[KEYPOINT_DICT['nose']];

    if (!nose || nose.score <= 0.3)
        return;

    // Estimate the floor using the visible heel and foot landmarks.
    const footIndices = [
        KEYPOINT_DICT['left_heel'],
        KEYPOINT_DICT['right_heel'],
        KEYPOINT_DICT['left_foot_index'],
        KEYPOINT_DICT['right_foot_index']
    ];

    const visibleFeet = footIndices.map(index => pose.keypoints[index]).filter(foot => foot && foot.score > 0.3);

    if (visibleFeet.length == 0)
        return;

    // Image y-coordinates increase downwards, so the greatest y is lowest.
    const floorY = Math.max(...visibleFeet.map(foot => foot.y));

    // Estimate the person's height in pixels from the nose to the floor.
    const bodyHeightPixels = floorY - nose.y;

    // Reject measurements when the full body is too small or invalid.
    if (!Number.isFinite(bodyHeightPixels) || bodyHeightPixels < 200)
        return;

    // patientHeight is in millimetres, so this ratio is mm per pixel.
    const ratio = patientHeight / bodyHeightPixels;

    if (!Number.isFinite(ratio) || ratio <= 0)
        return;

    // Calculate the vertical distance from each detected index fingertip
    // to the estimated floor line.
    const distances = [];

    for (const hand of handResult.landmarks) {
        const fingertip = hand[HAND_DETECTOR_DICT['INDEX_FINGER_TIP']];

        if (!fingertip)
            continue;

        const fingertipY = fingertip.y * canvas.height;
        const distancePixels = floorY - fingertipY;

        // Ignore fingertips that appear below the estimated floor line.
        if (distancePixels >= 0)
            distances.push(distancePixels);
    }

    if (distances.length === 0)
        return;

    // Average the measurements from the detected fingertips.
    const averageDistancePixels =
        distances.reduce((total, distance) => total + distance, 0) / distances.length;

    // Convert pixels to millimetres, then centimetres.
    const averageDistanceCm = averageDistancePixels * ratio / 10;

    if (!Number.isFinite(averageDistanceCm))
        return;

    // Keep the smallest distance achieved during the test.
    if (averageDistanceCm < currentFTFScore) {
        currentFTFScore = averageDistanceCm;
        points = Math.trunc(currentFTFScore);
    }
}

// ----------------------------------------
// McGill Core Endurance Test
// ----------------------------------------

let mcgillLastTimestamp = null;
let mcgillElapsedMs = 0;

function mcGillCoreEndurance(pose) {
    const currentTest = mcGillCoreEnduranceAngles;
    const limbThresholds = functionalTest(pose, currentTest);

    isUserInPosition = Object.keys(limbThresholds).length > 0 && Object.values(limbThresholds).every(limb => limb === true);

    // Reset the timer when the test stops or the position is incorrect.
    if (!isTestActive || !isUserInPosition) {
        mcgillLastTimestamp = null;
        mcgillElapsedMs = 0;
        return;
    }

    const currentTimestamp = performance.now();

    // Store the initial timestamp when the user first enters the position.
    if (mcgillLastTimestamp === null) {
        mcgillLastTimestamp = currentTimestamp;
        return;
    }

    // Accumulate time while the user maintains the correct position.
    mcgillElapsedMs += currentTimestamp - mcgillLastTimestamp;
    mcgillLastTimestamp = currentTimestamp;

    // Award one point for every complete second in the correct position.
    while (mcgillElapsedMs >= 1000) {
        points++;
        mcgillElapsedMs -= 1000;
    }
}



toggleCameraTracking();
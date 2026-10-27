export const sitToStandAngles = {
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
        minAngle: null,
        maxAngle: null,
        minDistance: 50,
        maxDistance: 70,
        withinAngleThreshold: false,
        withinDistanceThreshold: false,
    },

    leftCalf: {
        joint1: "left_ankle",
        joint2: "left_knee",
        minAngle: 70,
        maxAngle: 120,
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
        minAngle: null,
        maxAngle: null,
        minDistance: 50,
        maxDistance: 70,
        withinAngleThreshold: false,
        withinDistanceThreshold: false,
    },

    rightCalf: {
        joint1: "right_ankle",
        joint2: "right_knee",
        minAngle: 70,
        maxAngle: 120,
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

standingAngles: {

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
        minAngle: null,
        maxAngle: null,
        minDistance: 71,
        maxDistance: 91,
        withinAngleThreshold: false,
        withinDistanceThreshold: false,
    },

    leftCalf: {
        joint1: "left_ankle",
        joint2: "left_knee",
        minAngle: 70,
        maxAngle: 120,
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
        minAngle: null,
        maxAngle: null,
        minDistance: 71,
        maxDistance: 91,
        withinAngleThreshold: false,
        withinDistanceThreshold: false,
    },

    rightCalf: {
        joint1: "right_ankle",
        joint2: "right_knee",
        minAngle: 70,
        maxAngle: 120,
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
    }}
};
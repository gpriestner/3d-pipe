const view = canvas.getContext("2d");

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
window.addEventListener("resize", resize);

view.beginPath();
view.moveTo(100, 100);
view.lineTo(200, 200);
view.stroke();

class Cube {
    model = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
    ];
}
// Add vector to point
function add(point, vector) {
    return {
        x: point.x + vector.x,
        y: point.y + vector.y,
        z: point.z + vector.z
    };
}
// Subtract vector from point
function subtract(point, vector) {
    return {
        x: point.x - vector.x,
        y: point.y - vector.y,
        z: point.z - vector.z
    };
}
// Rotate around Y axis
function rotateY(point, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const x = point.x * cosA - point.z * sinA;
    const z = point.x * sinA + point.z * cosA;
    return { x, y: point.y, z };
}
// Rotate around X axis
function rotateX(point, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const y = point.y * cosA - point.z * sinA;
    const z = point.y * sinA + point.z * cosA;
    return { x: point.x, y, z };
}

function toLocalSpace(point, rotation, scale = 1) {
    // rotate
    const ry = rotateY(point, rotation.y);
    const rx = rotateX(ry, rotation.x);

    // scale 
    return {
        x: rx.x * scale,
        y: rx.y * scale,
        z: rx.z * scale
    };
}

function toWorldSpace(point, position) {
    // --- Translate ---
    return {
        x: point.x + position.x,
        y: point.y + position.y,
        z: point.z + position.z
    };
}

function toViewSpace(point, camera) {
    // Translate relative to camera
    const tx = subtract(point, camera.position);

    // Inverse rotate Y
    const ry = rotateY(tx, -camera.rotation.y);

    // Inverse rotate X
    const rz = rotateX(ry, -camera.rotation.x);

    return rz;
}

function toClipSpace(point, projection) {
    const { fov, aspect, near, far } = projection;

    // Prevent divide by zero
    if (point.z >= -near) return null; // Behind camera

    const f = 1 / Math.tan(fov * 0.5);

    return {
        x: point.x * f / aspect,
        y: point.y * f,
        z: (point.z - near) / (far - near),
        w: -point.z
    };
}

// x,y in [-1, 1], z in [0, 1]
function toNormalizedDeviceCoordinates(clip) {
    if (!clip || clip.w === 0) return null;

    return {
        x: clip.x / clip.w,
        y: clip.y / clip.w,
        z: clip.z / clip.w
    };
}

function toScreenSpace(ndc, screen) {
    const x = (ndc.x + 1) * 0.5 * screen.width;
    const y = (1 - ndc.y) * 0.5 * screen.height;

    return {
        x,
        y,
        visible:
            ndc.x >= -1 && ndc.x <= 1 &&
            ndc.y >= -1 && ndc.y <= 1 &&
            ndc.z <= 0 && ndc.z >= -1
    };
}

function drawPoint(point) {
    if (!point.visible) return;
    view.fillStyle = "black";
    view.beginPath();
    view.arc(point.x, point.y, 5, 0, Math.PI * 2);
    view.fill();
}

function projectPoint(point, rotation, scale, position, camera, projection, screen) {
    const local = toLocalSpace(point, rotation, scale);
    const world = toWorldSpace(local, position);
    const view = toViewSpace(world, camera);
    const clip = toClipSpace(view, projection);
    const ndc = toNormalizedDeviceCoordinates(clip);
    const screenPoint = toScreenSpace(ndc, screen);
    return screenPoint;
}

const vertex = { x: 0, y: 0, z: 0 };

const projectedPoint = projectPoint(
    vertex, 
    { x: 0, y: 0, z: 0 }, // rotation
    1, // scale 
    { x: 0, y: 0, z: -5 }, // position
    { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }, // camera 
    { fov: Math.PI / 2, aspect: canvas.width / canvas.height, near: 1, far: 10 }, // projection
    canvas // screen
);

drawPoint(projectedPoint);

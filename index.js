const X = 0, Y = 1, Z = 2;

const view = canvas.getContext("2d");

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
window.addEventListener("resize", resize);

class Shape3d {
    //model = [];
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    scale = 1;
    projectPoints(camera) {
        // for each point in model project to 2d screen space
        const projected = [];
        for (const vertex of this.model) {
            const local = toLocalSpace({ x: vertex[X], y: vertex[Y], z: vertex[Z] }, this.rotation, this.scale);
            const world = toWorldSpace(local, this.position);
            const view = toViewSpace(world, camera);
            const clip = toClipSpace(view, camera);
            if (!clip) continue;
            const ndc = toNormalizedDeviceCoordinates(clip);
            if (!ndc) continue;
            const screenPoint = toScreenSpace(ndc, canvas);
            if (screenPoint) projected.push(screenPoint);
        }
        return projected;
    }
    draw(camera) {
        const projected = this.projectPoints(camera);
        for (const point of projected) {
            drawPoint(point);
        }
    }
}

class Camera {
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    static aspect = canvas.width / canvas.height;
    projection = { fov: Math.PI / 2, near: 0.1, far: 1000 };
    static { addEventListener("resize", () => { this.aspect = canvas.width / canvas.height; }); }
}

class Cube extends Shape3d {
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
    const cp = subtract(point, camera.position);

    // Inverse rotate Y
    const ry = rotateY(cp, -camera.rotation.y);

    // Inverse rotate X
    const rx = rotateX(ry, -camera.rotation.x);

    return rx;
}

function toClipSpace(point, camera) {
    const { fov, near, far } = camera.projection;
    const aspect = Camera.aspect;

    // clip point if z is closer than near plane
    if (!(point.z < -near)) return null;

    // clip point if z is further than far plane
    if (-point.z > far) return null;

    const f = 1 / Math.tan(fov * 0.5);

    const A = (far + near) / (near - far);
    const B = (2 * far * near) / (near - far);

    const x_clip = point.x * (f / aspect);
    const y_clip = point.y * f;
    const z_clip = A * point.z + B;
    const w_clip = -point.z; // positive in front of the camera for z < 0

    // Frustum test in clip space: -w ≤ x,y,z ≤ w
    if (Math.abs(x_clip) > w_clip) return null;      // left/right planes
    if (Math.abs(y_clip) > w_clip) return null;      // top/bottom planes
    if (z_clip < -w_clip || z_clip > w_clip) return null; // near/far in OpenGL

    return { x: x_clip, y: y_clip, z: z_clip, w: w_clip };
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
            ndc.z >= 0 && ndc.z <= 1
    };
}

function drawPoint(point) {
    if (!point.visible) return;
    view.fillStyle = "black";
    view.beginPath();
    view.arc(point.x, point.y, 5, 0, Math.PI * 2);
    view.fill();
}

function projectPoint(point, rotation, scale, position, camera, screen) {
    const local = toLocalSpace(point, rotation, scale);
    const world = toWorldSpace(local, position);
    const view = toViewSpace(world, camera);
    const clip = toClipSpace(view, camera);
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
    { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, projection: { fov: Math.PI / 2, near: 0.1, far: 1000 } }, // camera 
    canvas // screen
);

//drawPoint(projectedPoint);

const camera = new Camera();
const cube = new Cube();
cube.position.z = -5;


function animate() {
    requestAnimationFrame(animate);
    view.clearRect(0, 0, canvas.width, canvas.height);
    cube.rotation.x += 0.01;
    //cube.rotation.y += 0.01;
    //cube.position.x += 0.01;
    //camera.position.z += 0.01;
    cube.draw(camera);
}
animate();

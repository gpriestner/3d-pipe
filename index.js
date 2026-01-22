const X = 0, Y = 1, Z = 2;
const view = canvas.getContext("2d");

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
window.addEventListener("resize", resize);
class Key {
    static #keys = {};
    static {
        window.addEventListener("keydown", Key.keyDown);
        window.addEventListener("keyup", Key.keyUp);
    }
    static keyDown(e) { if (!e.repeat) Key.#keys[e.code] = true; }
    static keyUp(e) { Key.#keys[e.code] = false; }
    static keyOnce(key) {
        const down = !!Key.#keys[key];
        Key.#keys[key] = false;
        return down;
    }
    static get Forward() { return !!Key.#keys.KeyW; }
    static get Backward() { return !!Key.#keys.KeyS; }
    static get StrafeLeft() { return !!Key.#keys.KeyA; }
    static get StrafeRight() { return !!Key.#keys.KeyD; }
    static get Reset() { return Key.keyOnce("KeyR") }
    static get TurnLeft() { return !!Key.#keys.Comma || !!Key.#keys.ArrowLeft }
    static get TurnRight() { return !!Key.#keys.Period || !!Key.#keys.ArrowRight }
    static get Shift() { return !!Key.#keys.ShiftLeft || !!Key.#keys.ShiftRight }
    static get Alt() { return !!Key.#keys.AltLeft || !!Key.#keys.AltRight }
    static get TiltUp() { return !!Key.#keys.ArrowUp }
    static get TiltDown() { return !!Key.#keys.ArrowDown }
}
Math.clamp = (val, min, max) => Math.min(Math.max(val, min), max);
class Nav {    
    static Heading = 0;
    static Elevation = 0
    static {
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === canvas) canvas.addEventListener("mousemove", Nav.update);
            else canvas.removeEventListener("mousemove", Nav.update);
        });
        canvas.addEventListener("click", () => {
            if (document.pointerLockElement === canvas) document.exitPointerLock();
            else canvas.requestPointerLock();
        });
        // canvas.addEventListener("wheel", (event) => {
        //     cameraPos[Y] -= event.deltaY * 0.003 * (Key.Shift * 5 + 1);
        //     cameraPos[Y] = Math.clamp(cameraPos[Y], 0.1, 80);
        // });
    }
    static update(e) {
        const turnSpeed = 0.001;
        Nav.Heading += e.movementX * turnSpeed;
        Nav.Elevation -= e.movementY * turnSpeed;
        Nav.Elevation = Math.clamp(Nav.Elevation, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    }
}

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
    moveTo(p) { view.moveTo(p.x, p.y); }
    lineTo(p) { view.lineTo(p.x, p.y); }
    line(p1, p2) { view.moveTo(p1.x, p1.y); view.lineTo(p2.x, p2.y); }
}
class Camera {
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0 };
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
    draw(camera) {
        view.strokeStyle = "black";
        view.lineWidth = 4;
        view.lineCap = "round";
        const projected = this.projectPoints(camera);
        view.beginPath();
        // front face
        this.line(projected[0], projected[1]);
        this.line(projected[1], projected[2]);
        this.line(projected[2], projected[3]);
        this.line(projected[3], projected[0]);
        // back face
        this.line(projected[4], projected[5]);
        this.line(projected[5], projected[6]);
        this.line(projected[6], projected[7]);
        this.line(projected[7], projected[4]);
        // sides
        this.line(projected[0], projected[4]);
        this.line(projected[1], projected[5]);
        this.line(projected[2], projected[6]);
        this.line(projected[3], projected[7]);
        view.stroke();
    }
}
class Pyramid extends Shape3d {
    model = [
        [-1, -1, -1],
        [1, -1, -1],
        [0, 1, 0],
        [-1, -1, 1],
        [1, -1, 1]
    ];
    draw(camera) {
        view.strokeStyle = "black";
        view.lineWidth = 4;
        view.lineCap = "round";
        const projected = this.projectPoints(camera);
        view.beginPath();
        // base
        this.line(projected[0], projected[1]);
        this.line(projected[1], projected[4]);
        this.line(projected[4], projected[3]);
        this.line(projected[3], projected[0]);
        // sides
        this.line(projected[0], projected[2]);
        this.line(projected[1], projected[2]);
        this.line(projected[3], projected[2]);
        this.line(projected[4], projected[2]);
        view.stroke();
    }
}
class TriangularPyramid extends Shape3d {
    model = [
        [0, 1, 0],
        [-1, -1, -1],
        [1, -1, -1],
        [0, -1, 1]
    ];
    draw(camera) {
        view.strokeStyle = "black";
        view.lineWidth = 4;
        view.lineCap = "round";
        const projected = this.projectPoints(camera);
        view.beginPath();
        // base
        this.line(projected[1], projected[2]);
        this.line(projected[2], projected[3]);
        this.line(projected[3], projected[1]);
        // sides
        this.line(projected[0], projected[1]);
        this.line(projected[0], projected[2]);
        this.line(projected[0], projected[3]);
        view.stroke();
    }
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

// Rotate a 3d point around an axis using Rodrigues rotation formula
function rotate(point, axis, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const dot = point.x * axis.x + point.y * axis.y + point.z * axis.z;
    return {
        x: point.x * cosA + (axis.x * dot) * (1 - cosA) + (axis.y * point.z - axis.z * point.y) * sinA,
        y: point.y * cosA + (axis.y * dot) * (1 - cosA) + (axis.z * point.x - axis.x * point.z) * sinA,
        z: point.z * cosA + (axis.z * dot) * (1 - cosA) + (axis.x * point.y - axis.y * point.x) * sinA
    };
}

function toLocalSpace(point, rotation, scale = 1) {
    // rotate
    const ry = rotateY(point, rotation.y);
    //const rx = rotateX(ry, rotation.x);

    // right vector
    const right = { x: 1, y: 0, z: 0 };
    const axis = rotateY(right, rotation.y);
    const rx = rotate(ry, axis, rotation.x);

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

    // Inverse rotate
    const ry = rotateY(cp, -camera.rotation.y);
    //const rx = rotateX(ry, -camera.rotation.x);

    // right vector
    const right = { x: 1, y: 0, z: 0 };
    const axis = rotateY(right, -camera.rotation.y);
    const rx = rotate(ry, axis, -camera.rotation.x);

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

//#region GUI
const gui = new dat.GUI();
const cubeFolder = gui.addFolder("Cube");

const positionFolder = cubeFolder.addFolder("Position");
positionFolder.add(cube.position, "x", -10, 10, 0.1);
positionFolder.add(cube.position, "y", -10, 10, 0.1);
positionFolder.add(cube.position, "z", -50, 0, 0.1);
positionFolder.open();
const rotationFolder = cubeFolder.addFolder("Rotation");
rotationFolder.add(cube.rotation, "x", 0, Math.PI * 2, 0.01);
rotationFolder.add(cube.rotation, "y", 0, Math.PI * 2, 0.01);
rotationFolder.open();
cubeFolder.add(cube, "scale", 0.1, 10, 0.1);

const cameraFolder = gui.addFolder("Camera");
const cameraPositionFolder = cameraFolder.addFolder("Position");
cameraPositionFolder.add(camera.position, "x", -10, 10, 0.1);
cameraPositionFolder.add(camera.position, "y", -10, 10, 0.1);
cameraPositionFolder.add(camera.position, "z", -50, 10, 0.1);
cameraPositionFolder.open();
const cameraRotationFolder = cameraFolder.addFolder("Rotation");
cameraRotationFolder.add(camera.rotation, "x", -Math.PI * 2, Math.PI * 2, 0.01);
cameraRotationFolder.add(camera.rotation, "y", -Math.PI * 2, Math.PI * 2, 0.01);
cameraRotationFolder.open();
cameraProjectionFolder = cameraFolder.addFolder("Projection");
cameraProjectionFolder.add(camera.projection, "fov", 0.1, Math.PI, 0.01);
cameraProjectionFolder.add(camera.projection, "near", 0.1, 100, 0.1);
cameraProjectionFolder.add(camera.projection, "far", 100, 2000, 1);
cameraProjectionFolder.open();
//#endregion

function animate() {
    requestAnimationFrame(animate);
    view.clearRect(0, 0, canvas.width, canvas.height);
    //cube.rotation.x += 0.01;
    //cube.rotation.y += 0.01;
    //cube.position.x += 0.01;
    //camera.position.z += 0.01;

    camera.rotation.y = Nav.Heading;
    camera.rotation.x = Nav.Elevation;

    cube.draw(camera);
}
animate();

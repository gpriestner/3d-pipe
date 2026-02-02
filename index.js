const X = 0, Y = 1, Z = 2;
const view = canvas.getContext("2d");
Math.clamp = (val, min, max) => Math.min(Math.max(val, min), max);
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
        // for each point in model, project to 2d screen space
        let id = 0;
        const projected = [];
        for (const vertex of this.model) {
            const point = { id, model: { x: vertex[X], y: vertex[Y], z: vertex[Z] } };
            this.projectPoint(point, camera);
            projected.push(point);
            id += 1;
        }
        return projected;
    }
    projectPoint(point, camera) {
        toLocalSpace(point, this.rotation, this.scale);
        toWorldSpace(point, this.position);
        toViewSpace(point, camera);
        toClipSpace(point, camera);
        toNormalizedDeviceCoordinates(point);
        toScreenSpace(point, canvas);
    }
    draw(camera) {
        // base draw just draws raw points for debugging
        const projected = this.projectPoints(camera);
        for (const point of projected) this.drawPoint(point);
    }
    moveTo(p) { view.moveTo(p.x, p.y); }
    lineTo(p) { view.lineTo(p.x, p.y); }
    face(...points) {
        if (points.length < 2) return;
        for (let i = 0; i < points.length - 1; i++) this.line(points[i], points[i + 1]);
    }
    drawPoint(p) {
        if (!p.screen.visible) return;
        view.fillStyle = "black";
        view.beginPath();
        view.arc(p.screen.x, p.screen.y, 5, 0, Math.PI * 2);
        view.fill();
    }
}
class Camera {
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0 };
    projection = {};
    static aspect = canvas.width / canvas.height;
    static { addEventListener("resize", () => { this.aspect = canvas.width / canvas.height; }); }
    constructor(fov = Math.PI / 2, near = 1, far = 100) {
        this.projection.fov = fov;
        this.projection.near = near;
        this.projection.far = far;
    }
}
class Face {
    static #idCounter = 0;
    id = Face.#idCounter++;
    constructor(vertices, parent) {
        this.vertices = vertices;
        this.parent = parent;

        // pre-compute unit normal
        const v0 = parent.model[vertices[0]];
        const v1 = parent.model[vertices[1]];
        const v2 = parent.model[vertices[2]];
        const p1 = { x: v0[X], y: v0[Y], z: v0[Z] };
        const p2 = { x: v1[X], y: v1[Y], z: v1[Z] };
        const p3 = { x: v2[X], y: v2[Y], z: v2[Z] };
        this.unitNormal = unitNormal(p1, p2, p3);
    }
    draw(projected, camera) {
        const vertices = this.vertices.map(v => projected[v]);
        // skip drawing and return if all vertices are clipped
        if (vertices.every(v => v.screen.clipped)) return;

        const unitNormal = { model: this.unitNormal };
        toLocalSpace(unitNormal, this.parent.rotation);
        const toFace = subtract(vertices[0].world, camera.position);
        //const normToFace = normalize(toFace);
        const dp = dot(unitNormal.local, toFace);

        if (dp >= 0) return; // backface culling

        this.drawFace(vertices);
        this.drawWireframe(vertices);
        this.drawNormal(vertices, camera);
    }
    drawWireframe(vertices) {
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i].screen;
            const p2 = vertices[(i + 1) % vertices.length].screen;
            line(p1, p2);
        }
    }
    drawFace(vertices) {
        // fill face
        view.beginPath();
        this.parent.moveTo(vertices[0].screen);
        for (let i = 1; i < vertices.length; i++) {
            this.parent.lineTo(vertices[i].screen);
        }
        view.closePath();
        view.fillStyle = "rgba(200,200,200,0.5)";
        view.fill();
    }
    drawNormal(vertices, camera) {
        // calculate dot in center of face
        const cp = centerPoint(...vertices);
        const center = { model: cp };
        this.parent.projectPoint(center, camera);

        // calculate normal and point at end of normal
        const normal = scale(this.unitNormal, 0.5);
        const normalEnd = { model: add(cp, normal) };
        this.parent.projectPoint(normalEnd, camera);
        line(center.screen, normalEnd.screen);

        // draw dots
        drawPoint(center.screen, "blue");
        drawPoint(normalEnd.screen, performance.now() % 1000 < 500 ? "lime" : "red");
    }
}
class Cube extends Shape3d {
    model = [
        [-1, -1, -1],   // 0 - top left back
        [1, -1, -1],    // 1 - top right back
        [1, 1, -1],     // 2 - bottom right back
        [-1, 1, -1],    // 3 - bottom left back
        [-1, -1, 1],    // 4 - top left front
        [1, -1, 1],     // 5 - top right front
        [1, 1, 1],      // 6 - bottom right front
        [-1, 1, 1],     // 7 - bottom left front
    ];
    faces = [
        new Face([4, 5, 6, 7], this), // near
        new Face([1, 0, 3, 2], this), // far
        new Face([5, 1, 2, 6], this), // right
        new Face([0, 4, 7, 3], this), // left
        new Face([0, 1, 5, 4], this), // top
        new Face([7, 6, 2, 3], this), // bottom
    ];
    draw(camera) {
        view.strokeStyle = "black";
        view.lineWidth = 4;
        view.lineCap = "round";
        const projected = this.projectPoints(camera);
        //view.beginPath();

        //#region Draw lines individually
        // // front face 0,1,2,3,0
        // this.line(projected[0], projected[1]);
        // this.line(projected[1], projected[2]);
        // this.line(projected[2], projected[3]);
        // this.line(projected[3], projected[0]);
        // // back face 4,5,6,7,4
        // this.line(projected[4], projected[5]);
        // this.line(projected[5], projected[6]);
        // this.line(projected[6], projected[7]);
        // this.line(projected[7], projected[4]);
        // // sides 0-4,1-5,2-6,3-7
        // this.line(projected[0], projected[4]);
        // this.line(projected[1], projected[5]);
        // this.line(projected[2], projected[6]);
        // this.line(projected[3], projected[7]);
        //#endregion

        // for (let i = 0; i < this.faces.length; i += 2) {
        //     const p1 = projected[this.faces[i]];
        //     const p2 = projected[this.faces[i + 1]];
        //     this.line(p1, p2);
        // }

        // draw faces
        // for (let j = 0; j < this.faces.length; j++) {
        //     const face = this.faces[j];
        //     for (let i = 0; i < face.length; i++) {
        //         const p1 = projected[face[i]];
        //         const p2 = projected[face[(i + 1) % face.length]];
        //         line(p1, p2);
        //     }
        // }

        for (const face of this.faces) { face.draw(projected, camera); }

        //view.stroke();
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

//#region Utils
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
// scale vector
function scale(vector, scalar) {
    return {
        x: vector.x * scalar,
        y: vector.y * scalar,
        z: vector.z * scalar
    };
}
// dot product
function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}
// normalize vector
function normalize(v) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return {
        x: v.x / length,
        y: v.y / length,
        z: v.z / length
    };
}
// convert from degrees to radians
function toRadians(degrees) { return degrees * Math.PI / 180; }
function line(p1, p2) {
    if (p1.clipped && p2.clipped) return;
    view.beginPath();
    if (!p1.clipped && !p2.clipped) {
        view.moveTo(p1.x, p1.y);
        view.lineTo(p2.x, p2.y);
        view.stroke();
        return;
    }
    const n = clipLine(p1, p2);
    view.moveTo(n.p1.x, n.p1.y);
    view.lineTo(n.p2.x, n.p2.y);
    view.arc(n.p2.x, n.p2.y, 12, 0, Math.PI * 2); // debugging
    view.stroke();
}
function clipLine(p1, p2) {
    const inside = p1.clipped ? p2 : p1;
    const outside = p1.clipped ? p1 : p2;
    const clips = [];

    const xMin = 0, yMin = 0;
    const xMax = canvas.width;
    const yMax = canvas.height;

    const dx = outside.x - inside.x;
    const dy = outside.y - inside.y;
    const eps = 1e-6;

    if (Math.abs(dx) > eps) { // check vertical boundaries
        {
            //check left boundary
            const t = (xMin - inside.x) / dx;
            const y = inside.y + t * dy;
            if (t >= 0) clips.push({ t, x: xMin, y });
        }
        {
            //check right boundary
            const t = (xMax - inside.x) / dx;
            const y = inside.y + t * dy;
            if (t >= 0) clips.push({ t, x: xMax, y });
        }
    }

    if (Math.abs(dy) > eps) { // check horizontal boundaries
        {
            // check top boundary
            const t = (yMin - inside.y) / dy;
            const x = inside.x + t * dx;
            if (t >= 0) clips.push({ t, x, y: yMin });
        }
        {
            // check bottom boundary
            const t = (yMax - inside.y) / dy;
            const x = inside.x + t * dx;
            if (t >= 0) clips.push({ t, x, y: yMax });
        }
    }

    if (clips.length === 0) return null; // should not happen!
    if (clips.length === 1) return { p1: inside, p2: clips[0] };
    // the point with the lowest t intercepts first - use that one
    const intercept = clips.reduce((a, b) => a.t < b.t ? a : b);
    return { p1: inside, p2: intercept };
}
function drawPoint(p, c = "red") {
    if (p.clipped) return;
    const oldStyle = view.fillStyle;
    view.fillStyle = c;
    view.beginPath();
    view.moveTo(p.x, p.y);
    view.arc(p.x, p.y, 5, 0, Math.PI * 2);
    view.fill();
    //view.closePath();
    view.fillStyle = oldStyle;
}

// Calculate the unit normal to a plane defined by 3 points
function unitNormal(p1, p2, p3) {
    const u = subtract(p2, p1);
    const v = subtract(p3, p1);
    const nx = u.y * v.z - u.z * v.y;
    const ny = u.z * v.x - u.x * v.z;
    const nz = u.x * v.y - u.y * v.x;
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return { x: nx / length, y: ny / length, z: nz / length };
}
// calculate the center of a set of points
function centerPoint(...points) {
    const center = { x: 0, y: 0, z: 0 };
    for (const p of points) {
        center.x += p.model.x;
        center.y += p.model.y;
        center.z += p.model.z;
    }
    center.x /= points.length;
    center.y /= points.length;
    center.z /= points.length;
    return center;
}
//#region Rotations
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
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dot = point.x * axis.x + point.y * axis.y + point.z * axis.z;
    return {
        x: point.x * cos + (axis.x * dot) * (1 - cos) + (axis.y * point.z - axis.z * point.y) * sin,
        y: point.y * cos + (axis.y * dot) * (1 - cos) + (axis.z * point.x - axis.x * point.z) * sin,
        z: point.z * cos + (axis.z * dot) * (1 - cos) + (axis.x * point.y - axis.y * point.x) * sin
    };
}
//#endregion Rotations
//#endregion Utils
//#region 3d Transformations
function toLocalSpace(p, rotation, scale = 1) {
    // scale
    const sp = {
        x: p.model.x * scale,
        y: p.model.y * scale,
        z: p.model.z * scale
    };

    // rotate
    const ry = rotateY(sp, rotation.y);
    const right = { x: 1, y: 0, z: 0 };
    const axis = rotateY(right, rotation.y);
    const rx = rotate(ry, axis, rotation.x);

    p.local = rx;

    //return rx;
}

function toWorldSpace(p, position) {
    // --- Translate ---
    const world = {
        x: p.local.x + position.x,
        y: p.local.y + position.y,
        z: p.local.z + position.z
    };

    p.world = world;
}

function toViewSpace(p, camera) {
    // Translate relative to camera
    const cp = subtract(p.world, camera.position);

    // Inverse rotate
    const ry = rotateY(cp, -camera.rotation.y);
    //const rx = rotateX(ry, -camera.rotation.x);

    // right vector
    const right = { x: 1, y: 0, z: 0 };
    const axis = rotateY(right, -camera.rotation.y);
    const rx = rotate(ry, axis, -camera.rotation.x);

    p.view = rx;
}

function toClipSpace(p, camera) {
    const { fov, near, far } = camera.projection;
    const aspect = Camera.aspect;
    let clipped = false;

    // clip point if z is closer than near plane
    if (!(p.view.z < -near)) clipped = true;

    // clip point if z is further than far plane
    if (-p.view.z > far) clipped = true;

    const f = 1 / Math.tan(fov * 0.5);

    const A = (far + near) / (near - far);
    const B = (2 * far * near) / (near - far);

    const x_clip = p.view.x * (f / aspect);
    const y_clip = p.view.y * f;
    const z_clip = A * p.view.z + B;
    const w_clip = -p.view.z; // positive in front of the camera for z < 0

    // Frustum test in clip space: -w ≤ x,y,z ≤ w
    if (Math.abs(x_clip) > w_clip) clipped = true;      // left/right planes
    if (Math.abs(y_clip) > w_clip) clipped = true;      // top/bottom planes
    if (z_clip < -w_clip || z_clip > w_clip) clipped = true; // near/far in OpenGL

    const clip = { x: x_clip, y: y_clip, z: z_clip, w: w_clip, clipped };

    p.clip = clip;
}

// x,y in [-1, 1], z in [0, 1]
function toNormalizedDeviceCoordinates(p) {
    if (Math.abs(p.clip.w) < 1e-6) {
        const ndc = { x: 0, y: 0, z: 0, clipped: true };
        p.ndc = ndc;
    } else {
        const ndc = {
            x: p.clip.x / p.clip.w,
            y: p.clip.y / p.clip.w,
            z: p.clip.z / p.clip.w,
            clipped: p.clip.clipped
        };
        p.ndc = ndc;
    }
}

function toScreenSpace(p, c) {
    const x = (p.ndc.x + 1) * 0.5 * c.width;
    const y = (1 - p.ndc.y) * 0.5 * c.height;

    const screen = {
        x,
        y,
        visible:
            p.ndc.x >= -1 && p.ndc.x <= 1 &&
            p.ndc.y >= -1 && p.ndc.y <= 1 &&
            p.ndc.z >= 0 && p.ndc.z <= 1,
        clipped: p.ndc.clipped
    };

    p.screen = screen;
}
//#endregion
function projectPoint(point, rotation, scale, position, camera, screen) {
    const local = toLocalSpace(point, rotation, scale);
    const world = toWorldSpace(local, position);
    const view = toViewSpace(world, camera);
    const clip = toClipSpace(view, camera);
    const ndc = toNormalizedDeviceCoordinates(clip);
    toScreenSpace(ndc, screen);
}


const camera = new Camera(Math.PI / 3);
const cube = new Cube();
cube.position.z = -10;

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
cameraRotationFolder.add(camera.rotation, "x", -Math.PI, Math.PI, 0.01).listen();
cameraRotationFolder.add(camera.rotation, "y", -Math.PI, Math.PI, 0.01).listen();
cameraRotationFolder.open();
const cameraProjectionFolder = cameraFolder.addFolder("Projection");
cameraProjectionFolder.add(camera.projection, "fov", 0.1, Math.PI, 0.01);
cameraProjectionFolder.add(camera.projection, "near", 0.1, 100, 0.1);
cameraProjectionFolder.add(camera.projection, "far", 100, 2000, 1);
cameraProjectionFolder.open();
//#endregion

let lastTs = 0;

function animate(ts) {
    requestAnimationFrame(animate);
    const delta = ts - lastTs;
    lastTs = ts;

    view.clearRect(0, 0, canvas.width, canvas.height);

    camera.rotation.y = Nav.Heading;
    camera.rotation.x = Nav.Elevation;

    cube.draw(camera);

    cube.rotation.y += Math.PI * 2 * 0.25 * (delta / 1000);
    cube.rotation.x += Math.PI * 2 * 0.1 * (delta / 1000);
}
requestAnimationFrame(animate);

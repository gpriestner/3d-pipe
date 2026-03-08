import { Key } from "./Key.js";
import { Nav } from "./Nav.js";
import { Util } from "./Util.js";
import { Plane } from "./Plane.js";
import { Tx } from "./Transform.js";
import { Camera } from "./Camera.js";
import { Shape3d } from "./Shape3d.js";
const X = 0, Y = 1, Z = 2;
const colors = ["yellow", "green", "white", "blue", "orange", "red"];
const view = canvas.getContext("2d");

Math.clamp = (val, min, max) => Math.min(Math.max(val, min), max);
function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    canvas.aspect = canvas.width / canvas.height;
    view.shadowOffsetX = 1;
    view.shadowOffsetY = 1;
}
resize();
window.addEventListener("resize", resize);

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
        const p0 = { x: v0[X], y: v0[Y], z: v0[Z] };
        const p1 = { x: v1[X], y: v1[Y], z: v1[Z] };
        const p2 = { x: v2[X], y: v2[Y], z: v2[Z] };
        this.unitNormal = Util.unitNormal(p0, p1, p2);
    }
    draw(projected, camera) {
        const vertices = this.vertices.map(v => projected[v]);
        // skip drawing and return if all vertices are clipped
        if (vertices.every(v => v.screen.clipped)) return;

        const unitNormal = { model: this.unitNormal };
        Tx.toLocalSpace(unitNormal, this.parent.rotation);
        const toFace = Util.subtract(vertices[0].world, camera.position);
        //const normToFace = Util.normalize(toFace);
        const dp = Util.dot(unitNormal.local, toFace);

        if (dp >= 0) return; // backface culling

        this.drawFace(vertices);
        //this.drawWireframe(vertices);
        //this.drawNormal(vertices, camera);
    }
    drawWireframe(vertices) {
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i].screen;
            const p2 = vertices[(i + 1) % vertices.length].screen;
            Util.line(p1, p2);
        }
    }
    drawFace(vertices) {
        const light = scene.lights[0];
        const normal = this.updateNormal();
        const toLight = Util.unit(Util.subtract(light.position, vertices[0].world));
        const dp = Util.dot(normal, toLight);
        const level = Math.clamp(dp, 0.1, 1);

        const color = Util.parseColor("grey");
        const shadedColor = Util.blend(color, light.color, level);
        const colorStr = Util.colorToString(shadedColor);

        // fill face
        view.beginPath();
        this.parent.moveTo(vertices.at(-1).screen);
        for (const v of vertices) this.parent.lineTo(v.screen);
        view.closePath();
        // view.fillStyle = colors[this.id % colors.length];
        view.fillStyle = colorStr;
        view.shadowColor = view.fillStyle;
        view.fill();
    }
    updateNormal() {
        const normal = { model: this.unitNormal };
        Tx.toLocalSpace(normal, this.parent.rotation);
        return normal.local;
    }
    drawNormal(vertices, camera) {
        // calculate point in center of face
        const cp = Util.centroid(...vertices);
        const center = { model: cp };
        this.parent.projectPoint(center, camera);

        // calculate normal and point at end of normal
        const normal = Util.scale(this.unitNormal, 0.5);
        const normalEnd = { model: Util.add(cp, normal) };
        this.parent.projectPoint(normalEnd, camera);
        Util.line(center.screen, normalEnd.screen);

        // draw dots
        Util.drawPoint(center.screen, "skyblue");
        Util.drawPoint(normalEnd.screen, performance.now() % 1000 < 500 ? "lime" : "red");
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
    draw(camera, delta) {
        this.update(delta);
        view.strokeStyle = "black";
        view.lineWidth = 4;
        view.lineCap = "round";
        const projected = this.projectPoints(camera);

        //view.beginPath();
        //#region Draw lines individually
        // // front face 0,1,2,3,0
        // this.Util.line(projected[0], projected[1]);
        // this.Util.line(projected[1], projected[2]);
        // this.Util.line(projected[2], projected[3]);
        // this.Util.line(projected[3], projected[0]);
        // // back face 4,5,6,7,4
        // this.Util.line(projected[4], projected[5]);
        // this.Util.line(projected[5], projected[6]);
        // this.Util.line(projected[6], projected[7]);
        // this.Util.line(projected[7], projected[4]);
        // // sides 0-4,1-5,2-6,3-7
        // this.Util.line(projected[0], projected[4]);
        // this.Util.line(projected[1], projected[5]);
        // this.Util.line(projected[2], projected[6]);
        // this.Util.line(projected[3], projected[7]);
        //#endregion
        //#region Draw faces using old method
        // for (let i = 0; i < this.faces.length; i += 2) {
        //     const p1 = projected[this.faces[i]];
        //     const p2 = projected[this.faces[i + 1]];
        //     this.Util.line(p1, p2);
        // }

        // draw faces
        // for (let j = 0; j < this.faces.length; j++) {
        //     const face = this.faces[j];
        //     for (let i = 0; i < face.length; i++) {
        //         const p1 = projected[face[i]];
        //         const p2 = projected[face[(i + 1) % face.length]];
        //         Util.line(p1, p2);
        //     }
        // }
        //#endregion
        //view.stroke();

        for (const face of this.faces) face.draw(projected, camera);
    }
}
class Light extends Shape3d {
    model = [[0, 0, 0]];
    constructor(x, y, z, c = "white", s = 1250) {
        super(x, y, z);
        this.color = Util.parseColor(c);
        this.scale = s;
        this.auto = { x: 0, y: 10, z: 0 };
    }
    draw(camera, delta) {
        this.update(delta);
        const p = this.projectPoints(camera)[0];
        if (p.screen.clipped) return;
        const d = 1 / Util.distance(p.world, camera.position);
        //Util.drawPoint(p.screen, "white");

        const gradient = view.createRadialGradient(p.screen.x, p.screen.y, 0, p.screen.x, p.screen.y, this.scale * d);
        const color = Util.colorToString(this.color);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.25, color);
        gradient.addColorStop(1, "transparent");
        view.fillStyle = gradient;
        view.shadowColor = "transparent";
        view.fillRect(p.screen.x - this.scale * d, p.screen.y - this.scale * d, this.scale * 2 * d, this.scale * 2 * d);
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
        view.Util.lineWidth = 4;
        view.Util.lineCap = "round";
        const projected = this.projectPoints(camera);
        view.beginPath();
        // base
        this.Util.line(projected[0], projected[1]);
        this.Util.line(projected[1], projected[4]);
        this.Util.line(projected[4], projected[3]);
        this.Util.line(projected[3], projected[0]);
        // sides
        this.Util.line(projected[0], projected[2]);
        this.Util.line(projected[1], projected[2]);
        this.Util.line(projected[3], projected[2]);
        this.Util.line(projected[4], projected[2]);
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
        view.Util.lineWidth = 4;
        view.Util.lineCap = "round";
        const projected = this.projectPoints(camera);
        view.beginPath();
        // base
        this.Util.line(projected[1], projected[2]);
        this.Util.line(projected[2], projected[3]);
        this.Util.line(projected[3], projected[1]);
        // sides
        this.Util.line(projected[0], projected[1]);
        this.Util.line(projected[0], projected[2]);
        this.Util.line(projected[0], projected[3]);
        view.stroke();
    }
}
class Scene {
    objects = [];
    lights = [];
    plane = null;
    addPlane(plane) { this.plane = plane; }
    addLight(light) { this.lights.push(light); this.add(light); }
    add(object) { this.objects.push(object); }
    draw(camera, delta) {
        if (this.plane) this.plane.draw(camera);
        for (const o of this.objects) {
            const dx = o.position.x - camera.position.x;
            const dy = o.position.y - camera.position.y;
            const dz = o.position.z - camera.position.z;
            o.distance = Math.hypot(dx, dy, dz);
        }
        this.objects.sort((a, b) => b.distance - a.distance);
        for (const o of this.objects) o.draw(camera, delta);
    }
}
//#region 3d Transformations
//#endregion

const scene = new Scene();
const plane = new Plane(20, 2);
scene.addPlane(plane);
const camera = new Camera(Math.PI / 3);
camera.position = { x: 0, y: 10, z: 20 };
const light = new Light(0, 10, -10, "yellow");
scene.addLight(light);
for (let i = 0; i < 20; i++) {
    const cube = new Cube(Util.rnd(-10, 10), Util.rnd(5, 20), Util.rnd(-55, -5));
    cube.auto = { x: Util.rnd(-1, 1), y: Util.rnd(-1, 1), z: Util.rnd(-1, 1) };
    scene.add(cube);
}

//#region GUI
const gui = new dat.GUI();
const lightFolder = gui.addFolder("Light");

const positionFolder = lightFolder.addFolder("Position");
positionFolder.add(light.position, "x", -50, 50, 0.01);
positionFolder.add(light.position, "y", -50, 50, 0.01);
positionFolder.add(light.position, "z", -50, 0, 0.01);
positionFolder.open();
lightFolder.add(light, "scale", 1, 10000);
lightFolder.addColor(light, "color");
lightFolder.open();

const cameraFolder = gui.addFolder("Camera");
const cameraPositionFolder = cameraFolder.addFolder("Position");
cameraPositionFolder.add(camera.position, "x", -10, 10, 0.1);
cameraPositionFolder.add(camera.position, "y", -10, 10, 0.1);
cameraPositionFolder.add(camera.position, "z", -50, 100, 0.1);
cameraPositionFolder.open();
const cameraRotationFolder = cameraFolder.addFolder("Rotation");
cameraRotationFolder.add(camera.rotation, "x", -Math.PI, Math.PI, 0.01).listen();
cameraRotationFolder.add(camera.rotation, "y", -Math.PI, Math.PI, 0.01).listen();
cameraRotationFolder.open();
const cameraProjectionFolder = cameraFolder.addFolder("Projection");
cameraProjectionFolder.add(camera.projection, "fov", 0.1, Math.PI, 0.01);
cameraProjectionFolder.add(camera.projection, "near", 0.1, 100, 0.1);
cameraProjectionFolder.add(camera.projection, "far", 2, 200, 1);
cameraProjectionFolder.open();
//#endregion

let lastTs = 0;
let delta = 0;
function animate(ts) {
    requestAnimationFrame(animate);
    delta = (ts - lastTs) / 1000;
    lastTs = ts;

    view.clearRect(0, 0, canvas.width, canvas.height);

    if (Key.TurnLeft) Nav.Heading -= 1 * delta;
    if (Key.TurnRight) Nav.Heading += 1 * delta;
    camera.rotation.y = Nav.Heading;
    camera.rotation.x = Nav.Elevation;

    if (Key.Forward) camera.position = Util.add(camera.position, Util.scale(camera.direction, 10 * delta));
    if (Key.Backward) camera.position = Util.add(camera.position, Util.scale(camera.backward, 10 * delta));
    if (Key.StrafeLeft) camera.position = Util.add(camera.position, Util.scale(camera.left, 10 * delta));
    if (Key.StrafeRight) camera.position = Util.add(camera.position, Util.scale(camera.right, 10 * delta));
    if (Key.Higher) camera.position.y += 10 * delta;
    if (Key.Lower) camera.position.y -= 10 * delta;

    scene.draw(camera, delta);
}
requestAnimationFrame(animate);


// Tests
function clipSpace(p, camera) {
    const point = { view: { x: p.x, y: p.y, z: p.z } };
    Tx.toClipSpace(point, camera);
    return Util.scale(point.clip, 1 / point.clip.w);
}
function test01() {
    const cam = new Camera(Math.PI / 2);
    cam.position = { x: 0, y: 0, z: 0 };

    const pNear = { x: 0, y: 0, z: -1 };
    const clipNear = clipSpace(pNear, cam);
    console.log(clipNear);

    const pFar = { x: 0, y: 0, z: -101 };
    const clipFar = clipSpace(pFar, cam);
    console.log(clipFar);

    const p1 = { x: -10, y: -10, z: -10 };
    const clip1 = clipSpace(p1, cam);
    console.log(clip1);
}

//test01();
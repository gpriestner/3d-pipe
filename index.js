import { Key } from "./Key.js";
import { Nav } from "./Nav.js";
import { Util } from "./Util.js";
import { Plane } from "./Plane.js";
import { Tx } from "./Transform.js";
import { Camera } from "./Camera.js";
import { Cube } from "./Cube.js";
import { Light } from "./Light.js";
import { Scene } from "./Scene.js";
import { Pyramid } from "./Pyramid.js";
import { TriangularPyramid } from "./TriangularPyramid.js";
import { Settings } from "./Settings.js";
const settings = new Settings();
const canvas = document.getElementById("canvas");
const view = canvas.getContext("2d");
canvas.backgroundX = 0;
canvas.backgroundY = 0;

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    canvas.aspect = canvas.width / canvas.height;
    view.shadowOffsetX = 1;
    view.shadowOffsetY = 1;
    view.font = "16px Arial";
}
resize();
window.addEventListener("resize", resize);


const scene = new Scene();
const plane = new Plane(40, 1);
scene.addPlane(plane);
const camera = new Camera(Math.PI / 3);
camera.position = { x: 0, y: 10, z: 20 };

const light = new Light(0, 10, -10, "yellow");
scene.addLight(light);
const light2 = new Light(-10, 10, -10, "green");
scene.addLight(light2);
const redLight = new Light(0, 30, -50, "red");
scene.addLight(redLight);

for (let i = 0; i < 20; i++) {
    const cube = new Cube(Util.rnd(-10, 10), Util.rnd(5, 20), Util.rnd(-55, -5));
    cube.auto = { x: Util.rnd(-1, 1), y: Util.rnd(-1, 1), z: Util.rnd(-1, 1) };
    scene.add(cube);
}

const tp = new TriangularPyramid(0, 1, -5, "cyan");
scene.add(tp);

class Process {
    static Input() {
        if (Key.TurnLeft) Nav.Heading -= 1 * delta;
        if (Key.TurnRight) Nav.Heading += 1 * delta;

        if (Nav.Speed) camera.position = Util.add(camera.position, Util.scale(camera.direction, Nav.Speed * delta));
        if (Nav.Left) camera.position = Util.add(camera.position, Util.scale(camera.left, 10 * delta));
        if (Nav.Right) camera.position = Util.add(camera.position, Util.scale(camera.right, 10 * delta));
        if (Key.Forward || Nav.Forward) camera.position = Util.add(camera.position, Util.scale(camera.direction, 10 * delta));
        if (Key.Backward || Nav.Reverse) camera.position = Util.add(camera.position, Util.scale(camera.backward, 10 * delta));
        if (Key.StrafeLeft) camera.position = Util.add(camera.position, Util.scale(camera.left, 10 * delta));
        if (Key.StrafeRight) camera.position = Util.add(camera.position, Util.scale(camera.right, 10 * delta));
        if (Key.Higher) camera.position.y += 10 * delta;
        if (Key.Lower) camera.position.y -= 10 * delta;
        if (camera.position.y < 3) camera.position.y = 3;
    }
}

//#region GUI
const gui = new dat.GUI();
gui.add(settings, "sky").onChange((value) => {
    let url = "";
    if (value) url = "url(res/sky02.jpg)";
    else url = "url(res/night.png)";
    canvas.style.backgroundImage = url;
});
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

let prev_ts = 0;
let delta = 0;
let fps = 0;
let frameCount = 0;
let prevTime = 0;
function animate(ts) {
    fps += 1;
    if (ts - prevTime >= 1000) {
        //console.log("FPS: " + fps);
        frameCount = fps;
        fps = 0;
        prevTime = ts;
    }
    requestAnimationFrame(animate);
    delta = (ts - prev_ts) / 1000;
    prev_ts = ts;

    Process.Input();
    camera.rotation.y = Nav.Heading;
    camera.rotation.x = Nav.Elevation;

    redLight.position.x = 30 * Math.cos(ts / 1000);
    redLight.position.z = -30 + 30 * Math.sin(ts / 1000);
    redLight.position.y = 20 + 10 * Math.sin(ts / 500);


    scene.draw(camera, delta);
    // Write current fps on the screen
    view.fillStyle = "white";
    view.fillText("FPS: " + frameCount, 10, 20);
}
requestAnimationFrame(animate);

//#region Tests
function clipSpace(p, camera) {
    const point = { view: { x: p.x, y: p.y, z: p.z } };
    Tx.toClipSpace(point, camera);
    return Util.scale(point.clip, 1 / point.clip.w);
}
function test01() {
    const cam = new Camera();

    const p1 = { view: { x: 0, y: 0, z: -1 }};
    toClipSpace(p1, cam);

    const p2 = { view: { x: 0, y: 0, z: -101 }};
    toClipSpace(p2, cam);

    const near = p1.clip.z / p1.clip.w;
    const far = p2.clip.z / p2.clip.w;

    console.log("near: " + near);
    console.log("far " + far);
}

//test01();
//#endregion Tests
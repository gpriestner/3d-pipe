
import { Util } from "./Util.js";
export class Camera {
    static canvas;
    static view;
    static aspect;
    static forward = { x: 0, y: 0, z: -1 };
    static right = { x: 1, y: 0, z: 0 };
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0 };
    projection = {};
    static aspect = canvas.height / canvas.width;
    static {
        Camera.canvas = document.getElementById("canvas");
        Camera.view = Camera.canvas.getContext("2d");
        Camera.aspect = innerHeight / innerWidth;
        addEventListener("resize", () => { Camera.aspect = Camera.canvas.height / Camera.canvas.width; });
    }
    constructor(fov = Math.PI / 2, near = 1, far = 101) {
        this.projection.fov = fov;
        this.projection.near = near;
        this.projection.far = far;
    }
    get direction() {
        const d = Util.rotate(this.heading, this.right, this.rotation.x);
        return d;
    }
    get heading() {
        const ry = Util.rotateY(Camera.forward, this.rotation.y);
        return ry;
    }
    get backward() { return Util.invert(this.direction); }
    get right() {
        const ry = Util.rotateY(Camera.right, this.rotation.y);
        return ry;
    }
    get left() { return Util.invert(this.right); }
}

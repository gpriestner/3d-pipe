import { Shape3d } from "./Shape3d.js";
import { Util } from "./Util.js";
const view = canvas.getContext("2d");

export class TriangularPyramid extends Shape3d {
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
        Util.line(projected[1], projected[2]);
        Util.line(projected[2], projected[3]);
        Util.line(projected[3], projected[1]);
        // sides
        Util.line(projected[0], projected[1]);
        Util.line(projected[0], projected[2]);
        Util.line(projected[0], projected[3]);
        view.stroke();
    }
}

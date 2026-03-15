import { Util } from "./Util.js";
import { Shape3d } from "./Shape3d.js";
const view = canvas.getContext("2d");
export class Pyramid extends Shape3d {
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
        Util.line(projected[0], projected[1]);
        Util.line(projected[1], projected[4]);
        Util.line(projected[4], projected[3]);
        Util.line(projected[3], projected[0]);
        // sides
        Util.line(projected[0], projected[2]);
        Util.line(projected[1], projected[2]);
        Util.line(projected[3], projected[2]);
        Util.line(projected[4], projected[2]);
        view.stroke();
    }
}

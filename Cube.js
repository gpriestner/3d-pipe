import { Shape3d } from "./Shape3d.js";
import { Face } from "./Face.js";
const view = canvas.getContext("2d");
export class Cube extends Shape3d {
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

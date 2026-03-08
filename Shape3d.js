import { Util } from "./Util.js";
import { Tx } from "./Transform.js";
const X = 0, Y = 1, Z = 2;
const view = canvas.getContext("2d");

export class Shape3d {
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    scale = 1;
    constructor(x = 0, y = 0, z = 0) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        this.view = view;
    }
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
        Tx.toLocalSpace(point, this.rotation, this.scale);
        Tx.toWorldSpace(point, this.position);
        Tx.toViewSpace(point, camera);
        Tx.toClipSpace(point, camera);
        Tx.toNdcSpace(point);
        Tx.toScreenSpace(point, canvas);
        // Tx.toXySpace(point, canvas);
    }
    update(delta) {
        if (this.auto) {
            this.rotation.x += this.auto.x * delta;
            this.rotation.y += this.auto.y * delta;
            this.rotation.z += this.auto.z * delta;
        }
    }
    draw(camera) {
        this.update();
        // base draw just draws raw points for debugging
        const projected = this.projectPoints(camera);
        for (const point of projected) this.Util.drawPoint(point);
    }
    moveTo(p) { view.moveTo(p.x, p.y); }
    lineTo(p) { view.lineTo(p.x, p.y); }
    face(...points) {
        if (points.length < 2) return;
        for (let i = 0; i < points.length - 1; i++) this.Util.line(points[i], points[i + 1]);
    }
    drawPoint(p) {
        if (!p.screen.visible) return;
        view.fillStyle = "black";
        view.beginPath();
        view.arc(p.screen.x, p.screen.y, 5, 0, Math.PI * 2);
        view.fill();
    }
    drawLine(p1, p2) { this.moveTo(p1); this.lineTo(p2); }
    drawLines(...points) {
        view.beginPath();
        this.moveTo(points.at(-1));
        for (let p of points) this.lineTo(p);
        view.closePath();
        view.stroke();
    }
}

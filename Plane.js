import { Shape3d } from "./Shape3d.js";
export class Plane extends Shape3d {
    model = [];
    constructor(sides, scale = 100) {
        super();
        this.sides = sides;
        this.scale = scale;
        this.offset = -sides / 2;
        for (let z = 0; z <= sides; z++) {
            for (let x = 0; x <= sides; x++) {
                const p1 = [(x + this.offset) * scale, 0, (z + this.offset) * scale];
                this.model.push(p1);
            }
        }
    }
    draw(camera) {
        const projected = this.projectPoints(camera);
        this.view.strokeStyle = "white";
        this.view.lineWidth = 1;

        const step = this.sides + 1;
        for (let z = 0; z < this.sides; z++) {
            for (let x = 0; x < this.sides; x++) {
                const sw = z * step + x;
                const se = sw + 1;
                const nw = se + this.sides;
                const ne = nw + 1;

                const p1 = projected[sw].screen;
                const p2 = projected[se].screen;
                const p3 = projected[ne].screen;
                const p4 = projected[nw].screen;

                // skip if all points are clipped
                if (p1.clipped && p2.clipped && p3.clipped && p4.clipped) continue;

                //this.drawLines(p1, p2, p3, p4);
                const color = (x + z) % 2 === 0 ? "grey" : "lightgrey";
                this.fillFace(color, p1, p2, p3, p4);
            }
        }
    }
    fillFace(color, ...points) {
        this.view.fillStyle = color;
        this.view.shadowColor = color;
        this.view.beginPath();
        this.moveTo(points.at(-1));
        for (const p of points) this.lineTo(p);
        this.view.fill();
    }
}

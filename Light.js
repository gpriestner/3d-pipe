
import { Shape3d } from "./Shape3d.js";
import { Util } from "./Util.js";
const view = canvas.getContext("2d");

export class Light extends Shape3d {
    model = [[0, 0, 0]];
    constructor(x, y, z, c = "white", s = 1250) {
        super(x, y, z);
        this.color = Util.parseColor(c);
        this.colorStop = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},0)`;
        this.scale = s;
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
        gradient.addColorStop(1, this.colorStop);
        view.fillStyle = gradient;
        view.shadowColor = "transparent";
        view.fillRect(p.screen.x - this.scale * d, p.screen.y - this.scale * d, this.scale * 2 * d, this.scale * 2 * d);
    }
}

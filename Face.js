import { Util } from "./Util.js";
import { Tx } from "./Transform.js";
const view = canvas.getContext("2d");
const X = 0, Y = 1, Z = 2;

export class Face {
    static #idCounter = 0;
    id = Face.#idCounter++;
    constructor(vertices, parent, color = "grey") {
        this.vertices = vertices;
        this.parent = parent;
        this.color = Util.parseColor(color);

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
        // blend all light sources together to calculate final color of face depending on angle of face to each light
        let finalColor = [0, 0, 0];
        const normal = this.updateNormal();
        for (const light of this.parent.scene.lights) {
            const toLight = Util.unit(Util.subtract(light.position, vertices[0].world));
            const dp = Util.dot(normal, toLight);
            const level = Util.clamp(dp, 0, 1);
            finalColor = Util.blend(finalColor, light.color, level);
        }

        // const light = scene.lights[0];
        // const normal = this.updateNormal();
        // const toLight = Util.unit(Util.subtract(light.position, vertices[0].world));
        // const dp = Util.dot(normal, toLight);
        // const level = Math.clamp(dp, 0.1, 1);

        //const color = Util.parseColor("grey");
        const shadedColor = Util.blend(finalColor, this.color, 0.5);
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

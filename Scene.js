const view = canvas.getContext("2d");
export class Scene {
    objects = [];
    lights = [];
    plane = null;
    addPlane(plane) { this.plane = plane; }
    addLight(light) { this.lights.push(light); this.add(light); }
    add(o) { o.scene = this; this.objects.push(o); }
    draw(camera, delta) {
        view.clearRect(0, 0, view.canvas.width, view.canvas.height);

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

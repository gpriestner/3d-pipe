import { Util } from "./Util.js";

export class Nav {
    static Heading = 0;
    static Elevation = 0;
    // static Direction = { x: 0, y: 0, z: -1 };
    static {
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === canvas) canvas.addEventListener("mousemove", Nav.update);
            else canvas.removeEventListener("mousemove", Nav.update);
        });
        canvas.addEventListener("click", () => {
            if (document.pointerLockElement === canvas) document.exitPointerLock();
            else canvas.requestPointerLock();
        });
        // canvas.addEventListener("wheel", (event) => {
        //     cameraPos[Y] -= event.deltaY * 0.003 * (Key.Shift * 5 + 1);
        //     cameraPos[Y] = Math.clamp(cameraPos[Y], 0.1, 80);
        // });
    }
    static update(e) {
        const turnSpeed = 0.001;
        Nav.Heading += e.movementX * turnSpeed;
        Nav.Elevation -= e.movementY * turnSpeed;
        Nav.Elevation = Util.clamp(Nav.Elevation, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
        // const cos = -Math.cos(Nav.Heading);
        // const sin = -Math.sin(Nav.Heading);
        // const heading = { x: -sin, y: 0, z: cos };
        // const pitch = { x: cos, y: 0, z: sin };
        // Nav.Direction = Util.rotate(heading, pitch, -Nav.Elevation);
        const scale = 1.2;
        canvas.backgroundX -= e.movementX * scale;
        canvas.backgroundY -= e.movementY * scale;
        canvas.style.backgroundPosition = `${canvas.backgroundX}px ${canvas.backgroundY}px`;
    }
}

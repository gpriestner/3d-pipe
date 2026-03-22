import { Util } from "./Util.js";

export class Nav {
    static Heading = 0;
    static Elevation = 0;
    static Forward = false;
    static Reverse = false;
    static Speed = 0;
    static Left = false;
    static Right = false;
    static WheelRelease = null;
    // static Direction = { x: 0, y: 0, z: -1 };
    static {
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === canvas) {
                canvas.addEventListener("mousemove", Nav.update);
                canvas.addEventListener("mousedown", Nav.mousedown);
                canvas.addEventListener("mouseup", Nav.mouseup);
                canvas.addEventListener("wheel", Nav.wheel);
            } else {
                canvas.removeEventListener("mousemove", Nav.update);
                canvas.removeEventListener("mousedown", Nav.mousedown);
                canvas.removeEventListener("mouseup", Nav.mouseup);
                canvas.removeEventListener("wheel", Nav.wheel);
            }
        });
        canvas.addEventListener("click", (e) => {
            if (e.button === 0) {
                if (document.pointerLockElement === canvas) document.exitPointerLock();
                else canvas.requestPointerLock();
            }
        });
        canvas.addEventListener("wheel", (e) => {
            Nav.Speed -= e.deltaY * 0.025;
            Nav.Speed = Util.clamp(Nav.Speed, -50, 50);

            if (e.deltaX < 0) Nav.Left = true; 
            else if (e.deltaX > 0) Nav.Right = true;
            if (Nav.Left || Nav.Right) {
                clearTimeout(Nav.WheelRelease);
                Nav.WheelRelease = setTimeout(() => {
                    Nav.Left = false;
                    Nav.Right = false;
                }, 100);
            }
            e.preventDefault();
        });
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
        e.preventDefault();
    }
    static mousedown(e) {
        if (e.button === 4) {
            Nav.Forward = true;
            e.preventDefault();
        }
        if (e.button === 3) {
            Nav.Reverse = true;
            e.preventDefault();
        }
    }
    static mouseup(e) {
        if (e.button === 4) {
            Nav.Forward = false;
            e.preventDefault();
        }
        if (e.button === 3) {
            Nav.Reverse = false;
            e.preventDefault();
        }
        if (e.button === 1) {
            Nav.Speed = 0;
            e.preventDefault();
        }
    }
}

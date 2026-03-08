import { Util } from "./Util.js";
import { Camera } from "./Camera.js";
export class Tx {
    static toLocalSpace(p, rotation, s = 1) {
        const sp = Util.scale(p.model, s);

        const ry = Util.rotateY(sp, rotation.y);
        const rx = Util.rotateX(ry, rotation.x);
        const rz = Util.rotateZ(rx, rotation.z);

        p.local = rz;
    }
    static toWorldSpace(p, position) {
        const world = {
            x: p.local.x + position.x,
            y: p.local.y + position.y,
            z: p.local.z + position.z
        };

        p.world = world;
    }
    static toViewSpace(p, camera) {
        // Translate point relative to camera
        const cp = Util.subtract(p.world, camera.position);

        // Inverse rotate (use negative angles)
        const ry = Util.rotateY(cp, -camera.rotation.y);
        const rx = Util.rotateX(ry, -camera.rotation.x);

        p.view = rx;
    }
    static toClipSpace(p, camera) {
        const { fov, near, far } = camera.projection;
        const aspect = Camera.aspect;
        let clipped = false;

        // // clip point if z is closer than near plane
        // if (!(p.view.z < -near)) clipped = true;
        // // clip point if z is further than far plane
        // if (-p.view.z > far) clipped = true;

        const f = 1 / Math.tan(fov / 2);
        const d = near - far;
        const A = (far + near) / d;
        const B = (2 * far * near) / d;

        const x_clip = p.view.x * (f * aspect);
        const y_clip = p.view.y * f;
        const z_clip = A * p.view.z + B;
        const w_clip = -p.view.z; // positive in front of the camera for z < 0

        // Frustum test in clip space: -w ≤ x,y,z ≤ w
        if (Math.abs(x_clip) > w_clip) clipped = true; // left/right planes
        if (Math.abs(y_clip) > w_clip) clipped = true; // top/bottom planes
        if (Math.abs(z_clip) > w_clip) clipped = true; // near/far planes

        p.clip = { x: x_clip, y: y_clip, z: z_clip, w: w_clip, clipped };
    }
    static toNdcSpace(p) {
        if (Math.abs(p.clip.w) < 1e-5) {
            p.ndc = { x: 0, y: 0, z: 0, clipped: true };
        } else {
            p.ndc = {
                x: p.clip.x / p.clip.w,
                y: p.clip.y / p.clip.w,
                z: p.clip.z / p.clip.w,
                clipped: p.clip.clipped
            };
        }
    }
    static toScreenSpace(p, c) {
        const x = (p.ndc.x + 1) * 0.5 * c.width;
        const y = (1 - p.ndc.y) * 0.5 * c.height;

        const screen = {
            x,
            y,
            clipped: p.ndc.clipped
        };

        p.screen = screen;
    }
    static toXySpace(p, c) {
        const x = p.view.x / p.view.z * Camera.aspect; // (Math.abs(p.view.z) * Math.tan(camera.projection.fov / 2) * Camera.aspect);
        const y = p.view.y / p.view.z; // (Math.abs(p.view.z) * Math.tan(camera.projection.fov / 2));
        const screen = {
            x: -x * c.width + c.width / 2,
            y: y * c.height + c.height / 2,
            clipped: Math.abs(p.view.x) > Math.abs(p.view.z) || Math.abs(p.view.y) > Math.abs(p.view.z) || p.view.z > -camera.projection.near || p.view.z < -camera.projection.far
        };
        p.screen = screen;
    }
}
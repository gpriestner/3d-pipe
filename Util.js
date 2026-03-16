export class Util {
    static canvas = null;
    static view = null;
    static {
        Util.canvas = document.getElementById("canvas");
        Util.view = Util.canvas.getContext("2d");
    }
    // clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    // random number between min and max
    static rnd(min, max) {
        return Math.random() * (max - min) + min;
    }
    // Util.add vector to point
    static add(point, vector) {
        return {
            x: point.x + vector.x,
            y: point.y + vector.y,
            z: point.z + vector.z
        };
    }
    // Util.subtract vector from point
    static subtract(point, vector) {
        return {
            x: point.x - vector.x,
            y: point.y - vector.y,
            z: point.z - vector.z
        };
    }
    // Util.scale vector
    static scale(vector, scalar) {
        return {
            x: vector.x * scalar,
            y: vector.y * scalar,
            z: vector.z * scalar
        };
    }
    static invert(vector) {
        return {
            x: -vector.x,
            y: -vector.y,
            z: -vector.z
        };
    }
    // Util.dot product
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }
    // Util.normalize vector
    static normalize(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length
        };
    }
    // convert from degrees to radians
    static toRadians(degrees) { return degrees * Math.PI / 180; }
    static line(p1, p2) {
        if (!p1.screen.clipped && !p2.screen.clipped) {
            Util.view.beginPath();
            Util.view.moveTo(p1.screen.x, p1.screen.y);
            Util.view.lineTo(p2.screen.x, p2.screen.y);
            Util.view.stroke();
            return;
        }
        if (p1.screen.clipped && p2.screen.clipped) return;
        const n = Util.clipline(p1, p2);
        Util.view.beginPath();
        Util.view.moveTo(n.p1.screen.x, n.p1.screen.y);
        Util.view.lineTo(n.p2.screen.x, n.p2.screen.y);
        Util.view.arc(n.p2.screen.x, n.p2.screen.y, 12, 0, Math.PI * 2); // debugging
        Util.view.stroke();
    }
    static clipline(p1, p2) {
        const inside = p1.clipped ? p2 : p1;
        const outside = p1.clipped ? p1 : p2;
        const clips = [];

        const xMin = 0, yMin = 0;
        const xMax = Util.canvas.width;
        const yMax = Util.canvas.height;

        const dx = outside.x - inside.x;
        const dy = outside.y - inside.y;
        const eps = 1e-6;

        if (Math.abs(dx) > eps) { // check vertical boundaries
            {
                //check left boundary
                const t = (xMin - inside.x) / dx;
                const y = inside.y + t * dy;
                if (t >= 0) clips.push({ t, x: xMin, y });
            }
            {
                //check right boundary
                const t = (xMax - inside.x) / dx;
                const y = inside.y + t * dy;
                if (t >= 0) clips.push({ t, x: xMax, y });
            }
        }

        if (Math.abs(dy) > eps) { // check horizontal boundaries
            {
                // check top boundary
                const t = (yMin - inside.y) / dy;
                const x = inside.x + t * dx;
                if (t >= 0) clips.push({ t, x, y: yMin });
            }
            {
                // check bottom boundary
                const t = (yMax - inside.y) / dy;
                const x = inside.x + t * dx;
                if (t >= 0) clips.push({ t, x, y: yMax });
            }
        }

        if (clips.length === 0) return null; // should not happen!
        if (clips.length === 1) return { p1: inside, p2: clips[0] };
        // the point with the lowest t intercepts first - use that one
        const intercept = clips.reduce((a, b) => a.t < b.t ? a : b);
        return { p1: inside, p2: intercept };
    }
    static drawPoint(p, c = "white") {
        if (p.clipped) return;
        const oldStyle = Util.view.fillStyle;
        Util.view.fillStyle = c;
        Util.view.beginPath();
        //Util.view.moveTo(p.x, p.y);
        Util.view.arc(p.x, p.y, 5, 0, Math.PI * 2);
        Util.view.fill();
        Util.view.stroke();
        Util.view.fillStyle = oldStyle;
    }
    // Calculate the unit length of a vector
    static unit(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length
        };
    }
    // Calculate the unit normal to a plane defined by 3 points
    static unitNormal(p1, p2, p3) {
        const u = Util.subtract(p2, p1);
        const v = Util.subtract(p3, p1);
        const nx = u.y * v.z - u.z * v.y;
        const ny = u.z * v.x - u.x * v.z;
        const nz = u.x * v.y - u.y * v.x;
        const l = Math.hypot(nx, ny, nz);
        return { x: nx / l, y: ny / l, z: nz / l };
    }
    // calculate the center of a set of points
    static centroid(...points) {
        const c = { x: 0, y: 0, z: 0 };
        for (const p of points) {
            c.x += p.model.x;
            c.y += p.model.y;
            c.z += p.model.z;
        }
        c.x /= points.length;
        c.y /= points.length;
        c.z /= points.length;
        return c;
    }
    static distance(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
    }
    static rotateY(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = point.x * cos - point.z * sin;
        const z = point.x * sin + point.z * cos;
        return { x, y: point.y, z };
    }
    // Rotate around X axis
    static rotateX(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const y = point.y * cos - point.z * sin;
        const z = point.y * sin + point.z * cos;
        return { x: point.x, y, z };
    }
    // Rotate around Z axis
    static rotateZ(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = point.x * cos - point.y * sin;
        const y = point.x * sin + point.y * cos;
        return { x, y, z: point.z };
    }
    // Rotate a 3d point around an axis using Rodrigues rotation formula
    static rotate(point, axis, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dot = point.x * axis.x + point.y * axis.y + point.z * axis.z;
        return {
            x: point.x * cos + (axis.x * dot) * (1 - cos) + (axis.y * point.z - axis.z * point.y) * sin,
            y: point.y * cos + (axis.y * dot) * (1 - cos) + (axis.z * point.x - axis.x * point.z) * sin,
            z: point.z * cos + (axis.z * dot) * (1 - cos) + (axis.x * point.y - axis.y * point.x) * sin
        };
    }
    // Blend two RGB colors
    static blend(c1, c2, t) {
        const r = Math.round(c1[0] * (1 - t) + c2[0] * t);
        const g = Math.round(c1[1] * (1 - t) + c2[1] * t);
        const b = Math.round(c1[2] * (1 - t) + c2[2] * t);
        return [r, g, b];
    }
    static parseColor(color) {
        if (color == null) return null;
        if (Array.isArray(color)) return color;
        const el = document.createElement('span');
        el.style.color = color;
        el.style.display = 'none';
        document.body.appendChild(el);
        const cs = getComputedStyle(el).color;
        el.remove();
        if (!cs) return null;
        const match = cs.match(/rgba?\s*\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
        if (!match) return null;
        return [Number(match[1]), Number(match[2]), Number(match[3])];
    }
    static colorToString(c) {
        return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
    static rndColor() {
        return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
    }
}

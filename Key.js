export class Key {
    static #keys = {};
    static {
        window.addEventListener("keydown", Key.keyDown);
        window.addEventListener("keyup", Key.keyUp);
    }
    static keyDown(e) { if (!e.repeat) Key.#keys[e.code] = true; }
    static keyUp(e) { Key.#keys[e.code] = false; }
    static keyOnce(key) {
        const down = !!Key.#keys[key];
        Key.#keys[key] = false;
        return down;
    }
    static get Reset() { return Key.keyOnce("KeyR") }
    
    static get Forward() { return !!Key.#keys.KeyW; }
    static get Backward() { return !!Key.#keys.KeyS; }
    static get StrafeLeft() { return !!Key.#keys.KeyA; }
    static get StrafeRight() { return !!Key.#keys.KeyD; }

    static get TurnLeft() { return !!Key.#keys.Comma || !!Key.#keys.ArrowLeft }
    static get TurnRight() { return !!Key.#keys.Period || !!Key.#keys.ArrowRight }
    static get TiltUp() { return !!Key.#keys.ArrowUp }
    static get TiltDown() { return !!Key.#keys.ArrowDown }

    static get Alt() { return !!Key.#keys.AltLeft || !!Key.#keys.AltRight }
    static get Shift() { return !!Key.#keys.ShiftLeft || !!Key.#keys.ShiftRight }
    static get Higher() { return !!Key.#keys.KeyE; }
    static get Lower() { return !!Key.#keys.KeyC; }
}

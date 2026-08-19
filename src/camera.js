class Camera {
    constructor() {
        this.x = 0; this.y = 0; this.z = 0;
        this.yaw = 0;
        this.targetYaw = 0;
        this.pitch = 0.3;
        this.distance = 5;
        this.maxPitch = Math.PI / 2 - 0.01;
        this.eyeHeight = 0.5;
        this.rotateSpeed = 8; // hur snabbt snäppningen animeras
    }

    // rotate(dYaw, dPitch) {
    //     this.yaw -= dYaw;
    //     this.pitch += dPitch;
    //     this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
    // }

    rotateStep(direction) {
        // direction: +1 eller -1, ett kvarts varv i taget
        this.targetYaw += direction * (Math.PI / 2);
    }

    update(dt) {
        // Mjuk interpolering mot targetYaw istället för att hoppa direkt
        const diff = this.targetYaw - this.yaw;
        this.yaw += diff * Math.min(1, this.rotateSpeed * dt);
    }

    followTarget(target) {
        const cosPitch = Math.cos(this.pitch);
        this.x = target.x + this.distance * Math.sin(this.yaw) * cosPitch;  // + istället för -
        this.y = target.y + this.eyeHeight + this.distance * Math.sin(this.pitch);
        this.z = target.z - this.distance * Math.cos(this.yaw) * cosPitch;  // oförändrad
    }
}

export const camera = new Camera();
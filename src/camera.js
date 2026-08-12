function rotateY(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos - z * sin, x * sin + z * cos];
}

class Camera {
    constructor() {
        this.x = 0; this.y = 2; this.z = -9;
        this.yaw = 0; this.pitch = 0;
        this.maxPitch = Math.PI / 2 - 0.01;
    }

    rotate(dYaw, dPitch) {
        this.yaw -= dYaw;
        this.pitch += dPitch;
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
    }

    move(moveX, moveZ, speed) {
        const [rotX, rotZ] = rotateY(moveX, moveZ, this.yaw);
        this.x += rotX * speed;
        this.z += rotZ * speed;
    }

    moveY(dy, speed) {
        this.y += dy * speed;
    }
}

export const camera = new Camera();
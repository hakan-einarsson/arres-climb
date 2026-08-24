export class EditorCamera {
    constructor() {
        this.x = 0;
        this.y = 10;
        this.z = -10;
        this.yaw = 0;
        this.pitch = 0.6;
        this.distance = 12;

        // Pivot center
        this.targetX = 0;
        this.targetY = 2;
        this.targetZ = 0;

        // Modes: 'inspect' or 'edit'
        this.mode = 'inspect';

        // Saved 3D inspect parameters for restore when leaving edit mode
        this.savedYaw = 0.5;
        this.savedPitch = 0.6;
        this.savedDistance = 12;

        this.updatePosition();
    }

    setMode(newMode) {
        if (this.mode === newMode) return;

        if (newMode === 'edit') {
            // Save inspect angles
            this.savedYaw = this.yaw;
            this.savedPitch = this.pitch;
            this.savedDistance = this.distance;

            // Snap to top-down
            this.mode = 'edit';
            this.yaw = 0;
            this.pitch = Math.PI / 2 - 0.001; // Just under 90 deg to avoid singularity
        } else {
            // Restore inspect mode
            this.mode = 'inspect';
            this.yaw = this.savedYaw;
            this.pitch = this.savedPitch;
            this.distance = this.savedDistance;
        }

        this.updatePosition();
    }

    rotate(dYaw, dPitch) {
        if (this.mode === 'edit') return; // Locked in top-down mode

        this.yaw += dYaw;
        this.pitch += dPitch;

        // Clamp pitch to avoid gimbal flip
        const maxPitch = Math.PI / 2 - 0.05;
        const minPitch = -Math.PI / 2 + 0.05;
        this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

        this.updatePosition();
    }

    pan(dx, dz) {
        // Pan in camera-relative screen space
        const cosYaw = Math.cos(this.yaw);
        const sinYaw = Math.sin(this.yaw);

        // Right vector
        const rightX = cosYaw;
        const rightZ = sinYaw;

        // Forward vector on horizontal plane
        const fwdX = -sinYaw;
        const fwdZ = cosYaw;

        this.targetX += (rightX * dx + fwdX * dz);
        this.targetZ += (rightZ * dx + fwdZ * dz);

        this.updatePosition();
    }

    zoom(delta) {
        const factor = 1.0 + delta * 0.0015;
        this.distance = Math.max(2, Math.min(60, this.distance * factor));
        this.updatePosition();
    }

    centerOn(targetX, targetY, targetZ) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.targetZ = targetZ;
        this.updatePosition();
    }

    updatePosition() {
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);

        this.x = this.targetX + this.distance * Math.sin(this.yaw) * cosPitch;
        this.y = this.targetY + this.distance * sinPitch;
        this.z = this.targetZ - this.distance * Math.cos(this.yaw) * cosPitch;
    }
}

export const editorCamera = new EditorCamera();
export default editorCamera;

import { world } from '../world.js';
import { player } from '../player.js';
import { coin } from '../coin.js';
import { camera } from '../camera.js';
import { updatePhysics } from '../physics.js';
import { rotateY } from '../update.js';
import { render } from '../render.js';
import { gameObjects, addGameObject } from '../gameObjects.js';
import { playLevelComplete, playFall, playCameraRotate, unlockAudio } from '../audio.js';
import { vertexShaderSource } from '../vertexShaderSource.js';
import { fragmentShaderSource } from '../fragmentShaderSource.js';
import textureUrl from '../assets/textures.png';

export class PlaytestRenderer {
    constructor(canvas, camera, aspectRatio = 1.0) {
        this.camera = camera;
        this.aspectRatio = aspectRatio;
        const gl = canvas.getContext('webgl2');
        this.gl = gl;

        const vs = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fs = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();
        this.program = program;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 24, 0);

        const texLoc = gl.getAttribLocation(program, 'a_texcoord');
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 24, 12);

        const lightLoc = gl.getAttribLocation(program, 'a_light');
        gl.enableVertexAttribArray(lightLoc);
        gl.vertexAttribPointer(lightLoc, 1, gl.FLOAT, false, 24, 20);

        gl.bindVertexArray(null);

        this.texture = this.loadTexture(textureUrl);

        gl.useProgram(program);
        gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
        gl.uniform1f(gl.getUniformLocation(program, 'u_focalLength'), 1.5);
        gl.uniform1f(gl.getUniformLocation(program, 'u_aspectRatio'), aspectRatio);
        gl.uniform1f(gl.getUniformLocation(program, 'u_near'), 0.3);
        gl.uniform1f(gl.getUniformLocation(program, 'u_far'), 100.0);

        this.flatVertices = [];
    }

    createShader(type, source) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        return s;
    }

    loadTexture(url) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

        const img = new Image();
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            [10240, 10241, 10242, 10243].forEach((p, i) => gl.texParameteri(gl.TEXTURE_2D, p, i < 2 ? 9728 : 33071));
        };
        img.src = url;
        return tex;
    }

    resize(w, h) {
        this.aspectRatio = w / h;
        this.gl.viewport(0, 0, w, h);
        this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'u_aspectRatio'), this.aspectRatio);
    }

    addObjectToRender(vertices) {
        for (let i = 0; i < vertices.length; i++) {
            this.flatVertices.push(vertices[i]);
        }
    }

    draw() {
        const gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);

        gl.clearColor(0.25, 0.3, 0.45, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.bindVertexArray(this.vao);
        const vertices = new Float32Array(this.flatVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);
        gl.bindVertexArray(null);

        this.flatVertices.length = 0;
    }
}

export class EditorPlaytest {
    constructor() {
        this.isActive = false;
        this.renderer = null;
        this.canvas = null;
        this.onExitCallback = null;
        this.keys = {};
        this.bannerText = '';
        this.bannerTimer = 0;
        this.spawnPos = { x: 0, y: 1, z: 0 };
        this.goalPos = { x: 0, y: 1, z: 0 };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start(canvas, editorWorld, onExit) {
        unlockAudio();
        this.isActive = true;
        this.canvas = canvas;
        this.onExitCallback = onExit;
        this.keys = {};
        this.bannerText = '🎮 Playtest Started! (WASD: Move, Space: Jump, Q/E: Rotate Cam, Esc: Exit)';
        this.bannerTimer = 3.5;

        if (!this.renderer) {
            this.renderer = new PlaytestRenderer(canvas, camera, canvas.width / (canvas.height || 1));
        }

        // Load current editor world configuration into game world
        world.clearWorld();
        world.applyLevelConfig({
            seed: editorWorld.seed,
            size: editorWorld.chunkRadius,
            maxHeight: editorWorld.maxHeight,
            islandFactor: editorWorld.islandFactor,
            scale: editorWorld.scale,
            threshold: editorWorld.threshold,
            heightTypeMap: [
                editorWorld.heightTypeMap.grassMax,
                editorWorld.heightTypeMap.rockMax,
                editorWorld.heightTypeMap.snowMax
            ]
        });
        world.createWorld(0, 0);

        if (Array.isArray(editorWorld.modifications) && editorWorld.modifications.length > 0) {
            world.applyModifications(editorWorld.modifications);
        }

        // Spawn player
        const sp = editorWorld.spawn || world.getSpawnPosition();
        this.spawnPos = { ...sp };
        player.spawnAt(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z);
        if (!gameObjects.includes(player)) {
            addGameObject(player);
        }

        // Set coin goal
        const gp = editorWorld.goal || world.getGoalPosition();
        this.goalPos = { ...gp };
        coin.setPosition(this.goalPos.x, this.goalPos.y, this.goalPos.z);
        coin.active = true;

        // Camera setup
        camera.yaw = 0;
        camera.targetYaw = 0;
        camera.pitch = 0.3;
        camera.distance = 5;
        camera.followTarget(player);

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        this.keys = {};
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        world.clearWorld();

        if (this.onExitCallback) {
            this.onExitCallback();
        }
    }

    respawnPlayer() {
        player.spawnAt(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z);
        coin.setPosition(this.goalPos.x, this.goalPos.y, this.goalPos.z);
        coin.active = true;
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        if (key === 'escape') {
            this.stop();
            return;
        }

        this.keys[key] = true;

        if (e.code === 'Space') {
            player.jumpBufferTimer = 0.12;
        }

        if (key === 'e') {
            camera.rotateStep(1);
            playCameraRotate();
        } else if (key === 'q') {
            camera.rotateStep(-1);
            playCameraRotate();
        } else if (key === 'r') {
            this.respawnPlayer();
            this.bannerText = 'Restarted at spawn point';
            this.bannerTimer = 1.5;
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;

        if (e.code === 'Space' && player.isJumping && player.vy > 0) {
            player.vy *= 0.4;
            player.isJumping = false;
        }
    }

    update(dt) {
        if (!this.isActive) return;

        if (this.bannerTimer > 0) {
            this.bannerTimer -= dt;
            if (this.bannerTimer <= 0) this.bannerText = '';
        }

        // Movement input
        let moveX = 0, moveZ = 0;
        if (this.keys['w'] || this.keys['arrowup']) moveZ += 1;
        if (this.keys['s'] || this.keys['arrowdown']) moveZ -= 1;
        if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
        if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

        const len = Math.hypot(moveX, moveZ);
        if (len > 0.2) {
            const angle = Math.atan2(moveZ, moveX);
            const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const sx = Math.cos(snapped);
            const sz = Math.sin(snapped);

            const [rotX, rotZ] = rotateY(sx, sz, camera.yaw);
            player.aimX = rotX;
            player.aimZ = rotZ;

            if (sx < -0.1) player.facing = -1;
            else if (sx > 0.1) player.facing = 1;

            player.vx = rotX * player.speed;
            player.vz = rotZ * player.speed;
        } else {
            player.vx = 0;
            player.vz = 0;
        }

        // Physics & objects update
        updatePhysics(player, dt);

        gameObjects.forEach(obj => {
            if (typeof obj.update === 'function') obj.update(dt);
        });

        coin.update(dt);

        // Win check
        if (coin.active && coin.checkCollision(player)) {
            coin.active = false;
            playLevelComplete();
            this.bannerText = '🎉 Coin Found! Level Complete! (Esc to exit)';
            this.bannerTimer = 4.0;
        }

        // Void fall check
        if (player.y < -4.0) {
            playFall();
            this.respawnPlayer();
            this.bannerText = 'Fell into the void! (Respawned)';
            this.bannerTimer = 2.0;
        }

        // Camera update
        camera.update(dt);
        camera.followTarget(player);
    }

    render() {
        if (!this.isActive || !this.renderer) return;

        const rect = this.canvas.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
        this.renderer.resize(w, h);

        render(this.renderer);
        this.renderer.draw();
    }
}

export const editorPlaytest = new EditorPlaytest();
export default editorPlaytest;

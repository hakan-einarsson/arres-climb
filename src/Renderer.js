import { vertexShaderSource } from './vertexShaderSource.js';
import { fragmentShaderSource } from './fragmentShaderSource.js';
// import { buildFrame } from './world.js';

class Renderer {
    constructor(canvas, camera, aspectRatio = 1.0) {
        this.camera = camera;
        this.aspectRatio = aspectRatio;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL not supported');
        }

        const vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Error linking program:', this.gl.getProgramInfoLog(program));
        }

        this.gl.useProgram(program);

        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.texture = this.loadTexture('assets/textures.png');

        const uTextureLoc = this.gl.getUniformLocation(program, 'u_texture');
        this.gl.uniform1i(uTextureLoc, 0); // texture unit 0
        const positionLocation = this.gl.getAttribLocation(program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(
            positionLocation,
            3,                                    // x, y, z nu
            this.gl.FLOAT,
            false,
            5 * Float32Array.BYTES_PER_ELEMENT,   // stride: 5 floats per vertex
            0
        );

        const texcoordLocation = this.gl.getAttribLocation(program, 'a_texcoord');
        this.gl.enableVertexAttribArray(texcoordLocation);
        this.gl.vertexAttribPointer(
            texcoordLocation,
            2,
            this.gl.FLOAT,
            false,
            5 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT    // UV börjar efter x,y,z
        );

        const uFocalLengthLoc = this.gl.getUniformLocation(program, 'u_focalLength');
        this.gl.uniform1f(uFocalLengthLoc, 1.5);
        const uAspectRatioLoc = this.gl.getUniformLocation(program, 'u_aspectRatio');
        this.gl.uniform1f(uAspectRatioLoc, aspectRatio);
        const uNearLoc = this.gl.getUniformLocation(program, 'u_near');
        const uFarLoc = this.gl.getUniformLocation(program, 'u_far');
        this.gl.uniform1f(uNearLoc, 0.3);   // samma som din NEAR-tröskel
        this.gl.uniform1f(uFarLoc, 100.0);  // långt bortom din scen

        this.gl.enable(this.gl.DEPTH_TEST);

        this.objectsToRender = [];
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    loadTexture(url) {
        const gl = this.gl;
        const texture = gl.createTexture();

        // Sätt en 1x1 placeholder-pixel direkt, så inget kraschar innan bilden laddats
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 0, 255, 255])); // magenta = "syns om texturen inte laddat än"

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };
        image.src = url;

        return texture;
    }
    addObjectToRender(vertices, depth) {
        this.objectsToRender.push({ vertices, depth });
    }
    draw() {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        // this.objectsToRender.sort((a, b) => b.depth - a.depth);

        const flat = [];
        for (const obj of this.objectsToRender) {
            flat.push(...obj.vertices);
        }

        const vertices = new Float32Array(flat);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 5); // OBS: /5 nu, inte /4

        this.objectsToRender = [];
    }
}
export default Renderer;
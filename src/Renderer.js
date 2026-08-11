import { vertexShaderSource } from './vertexShaderSource.js';
import { fragmentShaderSource } from './fragmentShaderSource.js';
import { buildFrame } from './world.js';

class Renderer {
    constructor(canvas, camera) {
        this.camera = camera;
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

        const positionLocation = this.gl.getAttribLocation(program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
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
    addObjectToRender(vertices, depth) {
        this.objectsToRender.push({ vertices, depth });
    }
    draw() {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.objectsToRender.sort((a, b) => b.depth - a.depth);

        const flat = [];
        for (const obj of this.objectsToRender) {
            flat.push(...obj.vertices);
        }

        const vertices = new Float32Array(flat);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);

        this.objectsToRender = [];
    }
}
export default Renderer;
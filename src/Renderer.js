import { vertexShaderSource } from './vertexShaderSource.js';
import { fragmentShaderSource } from './fragmentShaderSource.js';
import textureUrl from './assets/textures.png';
import { levelManager } from './levelManager.js';

class Renderer {
    constructor(canvas, camera, aspectRatio = 1.0) {
        this.canvas = canvas;
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
        gl.useProgram(program);

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.texture = this.loadTexture(textureUrl);

        gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 24, 0);

        const texLoc = gl.getAttribLocation(program, 'a_texcoord');
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 24, 12);

        const lightLoc = gl.getAttribLocation(program, 'a_light');
        gl.enableVertexAttribArray(lightLoc);
        gl.vertexAttribPointer(lightLoc, 1, gl.FLOAT, false, 24, 20);

        gl.uniform1f(gl.getUniformLocation(program, 'u_focalLength'), 1.5);
        gl.uniform1f(gl.getUniformLocation(program, 'u_aspectRatio'), aspectRatio);
        gl.uniform1f(gl.getUniformLocation(program, 'u_near'), 0.3);
        gl.uniform1f(gl.getUniformLocation(program, 'u_far'), 100.0);
        gl.enable(gl.DEPTH_TEST);

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
        if (levelManager.isVictory) {
            gl.clearColor(0.25, 0.3, 0.45, 0);
            this.canvas.style.background = 'linear-gradient(180deg,#0a1128,#f72585)';
        } else {
            gl.clearColor(0.25, 0.3, 0.45, 1);
            if (this.canvas.style.background) this.canvas.style.background = '';
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const vertices = new Float32Array(this.flatVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);

        this.flatVertices.length = 0;
    }
}

export default Renderer;

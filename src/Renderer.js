import { vertexShaderSource } from './vertexShaderSource.js';
import { fragmentShaderSource } from './fragmentShaderSource.js';
import textureUrl from './assets/textures.png';

class Renderer {
    constructor(canvas, camera, aspectRatio = 1.0) {
        this.camera = camera;
        this.aspectRatio = aspectRatio;
        const gl = canvas.getContext('webgl2');
        this.gl = gl;

        const vs = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fs = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();
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
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 20, 0);

        const texLoc = gl.getAttribLocation(program, 'a_texcoord');
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 20, 12);

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
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };
        img.src = url;
        return tex;
    }

    addObjectToRender(vertices) {
        for (let i = 0; i < vertices.length; i++) {
            this.flatVertices.push(vertices[i]);
        }
    }

    draw() {
        const gl = this.gl;
        gl.clearColor(0.3, 0.3, 0.5, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const vertices = new Float32Array(this.flatVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 5);

        this.flatVertices.length = 0;
    }
}

export default Renderer;

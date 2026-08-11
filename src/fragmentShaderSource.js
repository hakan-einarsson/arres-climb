export const fragmentShaderSource = `#version 300 es  
        precision mediump float;
        out vec4 outColor;
        void main() {
            outColor = vec4(0.2, 0.4, 0.6, 0.7);
        }
        `;
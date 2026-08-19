export const fragmentShaderSource = `#version 300 es
  precision mediump float;

  in vec2 v_texcoord;
  out vec4 outColor;

  uniform sampler2D u_texture;

  void main() {
    vec4 color = texture(u_texture, v_texcoord);
    if (color.a < 0.1) discard;
    outColor = color;
  }
`;
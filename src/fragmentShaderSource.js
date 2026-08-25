export const fragmentShaderSource = `#version 300 es
precision mediump float;
in vec2 v_texcoord;in float v_light;
out vec4 outColor;
uniform sampler2D u_texture;
void main(){
vec4 c=texture(u_texture,v_texcoord);
if(c.a<.1)discard;
outColor=vec4(c.rgb*v_light,c.a);
}`;

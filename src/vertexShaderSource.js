export const vertexShaderSource = `#version 300 es
in vec3 a_position;in vec2 a_texcoord;out vec2 v_texcoord;
uniform float u_focalLength,u_aspectRatio,u_near,u_far;
void main(){
float z=a_position.z;
gl_Position=vec4(a_position.x*u_focalLength,a_position.y*u_focalLength*u_aspectRatio,(u_far+u_near)/(u_far-u_near)*z-(2.*u_far*u_near)/(u_far-u_near),z);
v_texcoord=a_texcoord;
}`;

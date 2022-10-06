import { Gfx3Texture } from '../gfx3/gfx3_texture';

export interface Gfx3Material {
  ambiant: vec3;
  specular: vec4;
  color: vec4;
  lightning: boolean;
  texture: Gfx3Texture | null;
  normalMap: Gfx3Texture | null;
  envMap: Gfx3Texture | null;
};
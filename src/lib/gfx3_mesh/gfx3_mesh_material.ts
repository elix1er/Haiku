import { Gfx3Texture } from '../gfx3/gfx3_texture';

class Gfx3Material {
  opacity: number;
  ambiant: vec4;
  specular: vec4;
  diffuse: vec4;
  lightning: boolean;
  texture: Gfx3Texture | null;
  normalMap: Gfx3Texture | null;
  envMap: Gfx3Texture | null;

  constructor(options: {
    opacity?: number,
    ambiant?: vec4,
    specular?: vec4,
    diffuse?: vec4,
    lightning?: boolean,
    texture?: Gfx3Texture,
    normalMap?: Gfx3Texture,
    envMap?: Gfx3Texture
  }) {
    this.opacity = options.opacity ?? 1;
    this.ambiant = options.ambiant ?? [0.5, 0.5, 0.5, 1];
    this.specular = options.specular ?? [0.0, 0.0, 0.0, 1.0];
    this.diffuse = options.diffuse ?? [1.0, 1.0, 1.0, 1.0];
    this.lightning = options.lightning ?? false;
    this.texture = options.texture ?? null;
    this.normalMap = options.normalMap ?? null;
    this.envMap = options.envMap ?? null;
  }
}

export { Gfx3Material };
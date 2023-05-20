import { UT } from '../core/utils';
import { UniformGroup } from '../gfx3/gfx3_manager';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { gfx3MeshRenderer } from './gfx3_mesh_renderer';

type MaterialOptions = {
  opacity?: number,
  ambiant?: vec4_buf,
  specular?: vec4_buf,
  diffuse?: vec4_buf,
  emissive?: vec3_buf,
  specularity?: number,
  lightning?: boolean,
  texture?: Gfx3Texture,
  normalMap?: Gfx3Texture,
  normalIntensity?: number,
  envMap?: Gfx3Texture,
  envMapEq?: Gfx3Texture,
  emissiveMap?: Gfx3Texture,
  emissiveIntensity?: number;
  roughnessMap?: Gfx3Texture;
};

class Gfx3Material {
  opacity: number;
  ambiant: vec4_buf;
  emissive: vec3_buf;
  specularity: number;
  specular: vec4_buf;
  diffuse: vec4_buf;
  lightning: boolean;
  texture: Gfx3Texture | null;
  normalMap: Gfx3Texture | null;
  emissiveMap: Gfx3Texture | null;
  emissiveIntensity: number;
  roughnessMap: Gfx3Texture | null;
  envMap: Gfx3Texture | null;
  envMapEq: Gfx3Texture | null;
  normalIntensity: number;
  buffer: UniformGroup;
  changed: boolean;

  constructor(options: MaterialOptions) {
    this.opacity = options.opacity ?? 1;
    this.ambiant = options.ambiant ?? UT.VEC4_CREATE(0.05, 0.05, 0.05, 1);
    this.specular = options.specular ?? UT.VEC4_CREATE(0.0, 0.0, 0.0, 0.0);
    this.diffuse = options.diffuse ?? UT.VEC4_CREATE(1.0, 1.0, 1.0, 1.0);
    this.emissive = options.emissive ?? UT.VEC4_CREATE(0.0, 0.0, 0.0);
    this.specularity = 1.0;
    this.normalIntensity = 1.0;
    this.lightning = options.lightning ?? false;
    this.texture = options.texture ?? null;
    this.normalMap = options.normalMap ?? null;
    this.envMap = options.envMap ?? null;
    this.envMapEq = options.envMapEq ?? null;
    this.emissiveMap = options.emissiveMap ?? null;
    this.roughnessMap = options.roughnessMap ?? null;
    this.emissiveIntensity = 1.0;
    this.buffer = gfx3MeshRenderer.createMaterialBuffer();
    this.changed = true;
  }

  delete(): void {
    gfx3MeshRenderer.destroyMaterialBuffer(this.buffer);
  }

  draw(): void {
    const params = UT.VEC6_CREATE();
    params[0] = this.opacity;
    params[1] = this.texture ? 1 : 0;
    params[2] = this.lightning ? 1 : 0;
    params[3] = this.normalMap ? 1 : 0;
    params[4] = this.envMap ? 1 : this.envMapEq ? 2 : 0;
    params[5] = this.roughnessMap ? 1 :0;

    this.buffer.beginWrite();
    this.buffer.write(0, this.ambiant);
    this.buffer.write(1, this.diffuse);
    this.buffer.write(2, this.specular);
    this.buffer.write(3, params);
    this.buffer.endWrite();

    const defaultTexture = gfx3MeshRenderer.getDefaultTexture();
    const defaultEnvMap = gfx3MeshRenderer.getDefaultEnvMap();

    this.buffer.setSamplerEntry(0, 4, this.texture ? this.texture.gpuSampler : defaultTexture.gpuSampler);
    this.buffer.setTextureEntry(0, 5, this.texture ? this.texture.gpuTexture : defaultTexture.gpuTexture);
    this.buffer.setTextureEntry(0, 6, this.roughnessMap ? this.roughnessMap.gpuTexture : defaultTexture.gpuTexture);
    this.buffer.setTextureEntry(0, 7, this.normalMap ? this.normalMap.gpuTexture : defaultTexture.gpuTexture);
    this.buffer.setSamplerEntry(0, 8, this.envMap ? this.envMap.gpuSampler : defaultEnvMap.gpuSampler);
    this.buffer.setTextureEntry(0, 9, this.envMap ? this.envMap.gpuTexture : defaultEnvMap.gpuTexture, { dimension: 'cube' });
    this.buffer.setSamplerEntry(0, 10, this.envMapEq ? this.envMapEq.gpuSampler : defaultTexture.gpuSampler);
    this.buffer.setTextureEntry(0, 11, this.envMapEq ? this.envMapEq.gpuTexture : defaultTexture.gpuTexture);
    this.buffer.refresh(0);
    this.changed = false;
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
    this.changed = true;
  }

  getBuffer(): UniformGroup {
    return this.buffer;
  }
}

export { Gfx3Material };
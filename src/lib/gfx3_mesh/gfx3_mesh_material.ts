import { gfx3Manager, UniformGroupDataset, UniformGroupBitmaps } from '../gfx3/gfx3_manager';
import { gfx3MeshRenderer } from './gfx3_mesh_renderer';
import { UT } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';

type MaterialOptions = {
  opacity?: number,
  diffuse?: vec4_buf,
  ambiant?: vec4_buf,
  specular?: vec4_buf,
  lightning?: boolean,
  texture?: Gfx3Texture,
  normalMap?: Gfx3Texture,
  roughnessMap?: Gfx3Texture;
  envMap?: Gfx3Texture,
  envMapEq?: Gfx3Texture
};

class Gfx3Material {
  params: vec6_buf;
  ambiant: vec4_buf;
  diffuse: vec4_buf;
  specular: vec4_buf;
  texture: Gfx3Texture;
  normalMap: Gfx3Texture;
  roughnessMap: Gfx3Texture;
  envMap: Gfx3Texture;
  envMapEq: Gfx3Texture;
  dataBuffer: UniformGroupDataset;
  dataChanged: boolean;
  texturesBuffer: UniformGroupBitmaps;
  texturesChanged: boolean;

  constructor(options: MaterialOptions) {
    this.params = UT.VEC6_CREATE();
    this.params[0] = options.opacity ?? 1;
    this.params[1] = options.texture ? 1 : 0;
    this.params[2] = options.lightning ? 1 : 0;
    this.params[3] = options.normalMap ? 1 : 0;
    this.params[4] = options.envMap ? 1 : options.envMapEq ? 2 : 0;
    this.params[5] = options.roughnessMap ? 1 : 0;
    this.diffuse = options.diffuse ?? UT.VEC4_CREATE(1.0, 1.0, 1.0, 1.0);
    this.ambiant = options.ambiant ?? UT.VEC4_CREATE(0.05, 0.05, 0.05, 1);
    this.specular = options.specular ?? UT.VEC4_CREATE(0.0, 0.0, 0.0, 0.0);
    this.texture = options.texture ?? gfx3MeshRenderer.getDefaultTexture();
    this.roughnessMap = options.roughnessMap ?? gfx3MeshRenderer.getDefaultTexture();
    this.normalMap = options.normalMap ?? gfx3MeshRenderer.getDefaultTexture();
    this.envMap = options.envMap ?? gfx3MeshRenderer.getDefaultEnvMap();
    this.envMapEq = options.envMapEq ?? gfx3MeshRenderer.getDefaultTexture();

    this.dataBuffer = gfx3Manager.createUniformGroupDataset('MESH_PIPELINE', 2);
    this.dataBuffer.addInput(0, UT.VEC4_SIZE, 'MAT_AMBIANT_COLOR');
    this.dataBuffer.addInput(1, UT.VEC4_SIZE, 'MAT_DIFFUSE_COLOR');
    this.dataBuffer.addInput(2, UT.VEC4_SIZE, 'MAT_SPECULAR');
    this.dataBuffer.addInput(3, UT.VEC6_SIZE, 'MAT_PARAMS');
    this.dataBuffer.allocate();
    this.dataChanged = true;

    this.texturesBuffer = gfx3Manager.createUniformGroupBitmaps('MESH_PIPELINE', 3);
    this.texturesBuffer.addSamplerInput(0, this.texture.gpuSampler);
    this.texturesBuffer.addTextureInput(1, this.texture.gpuTexture);
    this.texturesBuffer.addSamplerInput(2, this.roughnessMap.gpuSampler);
    this.texturesBuffer.addTextureInput(3, this.roughnessMap.gpuTexture);
    this.texturesBuffer.addSamplerInput(4, this.normalMap.gpuSampler);
    this.texturesBuffer.addTextureInput(5, this.normalMap.gpuTexture);
    this.texturesBuffer.addSamplerInput(6, this.envMap.gpuSampler);
    this.texturesBuffer.addTextureInput(7, this.envMap.gpuTexture, { dimension: 'cube' });
    this.texturesBuffer.addSamplerInput(8, this.envMapEq.gpuSampler);
    this.texturesBuffer.addTextureInput(9, this.envMapEq.gpuTexture);
    this.texturesBuffer.allocate();
    this.texturesChanged = false;
  }

  delete(): void {
    this.dataBuffer.destroy();
  }

  setOpacity(opacity: number): void {
    this.params[0] = opacity;
    this.dataChanged = true;
  }

  setAmbiant(r: number, g: number, b: number): void {
    this.ambiant[0] = r;
    this.ambiant[1] = g;
    this.ambiant[2] = b;
    this.dataChanged = true;
  }

  setSpecular(r: number, g: number, b: number, specularity: number): void {
    this.specular[0] = r;
    this.specular[1] = g;
    this.specular[2] = b;
    this.specular[3] = specularity;
    this.dataChanged = true;
  }

  setDiffuse(r: number, g: number, b: number): void {
    this.diffuse[0] = r;
    this.diffuse[1] = g;
    this.diffuse[2] = b;
    this.dataChanged = true;
  }

  setLightning(lightning: boolean): void {
    this.params[2] = lightning ? 1 : 0;
    this.dataChanged = true;
  }

  setTexture(texture: Gfx3Texture): void {
    this.texture = texture;
    this.params[1] = 1;
    this.texturesChanged = true;
  }

  setRoughnessMap(roughnessMap: Gfx3Texture): void {
    this.roughnessMap = roughnessMap;
    this.params[5] = 1;
    this.texturesChanged = true;
  }

  setNormalMap(normalMap: Gfx3Texture): void {
    this.normalMap = normalMap;
    this.params[3] = 1;
    this.texturesChanged = true;
  }

  setEnvMap(envMap: Gfx3Texture): void {
    this.envMap = envMap;
    this.params[4] = 1;
    this.texturesChanged = true;
  }

  setEnvMapEq(envMapEq: Gfx3Texture): void {
    this.envMapEq = envMapEq;
    this.params[4] = 2;
    this.texturesChanged = true;
  }

  getDataBuffer(): UniformGroupDataset {
    if (this.dataChanged) {
      this.dataBuffer.beginWrite();
      this.dataBuffer.write(0, this.ambiant);
      this.dataBuffer.write(1, this.diffuse);
      this.dataBuffer.write(2, this.specular);
      this.dataBuffer.write(3, this.params);
      this.dataBuffer.endWrite();
      this.dataChanged = false;
    }

    return this.dataBuffer;
  }

  getTexturesBuffer(): UniformGroupBitmaps {
    if (this.texturesChanged) {
      this.texturesBuffer.setSamplerInput(0, this.texture.gpuSampler);
      this.texturesBuffer.setTextureInput(1, this.texture.gpuTexture);
      this.texturesBuffer.setSamplerInput(2, this.roughnessMap.gpuSampler);
      this.texturesBuffer.setTextureInput(3, this.roughnessMap.gpuTexture);
      this.texturesBuffer.setSamplerInput(4, this.normalMap.gpuSampler);
      this.texturesBuffer.setTextureInput(5, this.normalMap.gpuTexture);
      this.texturesBuffer.setSamplerInput(6, this.envMap.gpuSampler);
      this.texturesBuffer.setTextureInput(7, this.envMap.gpuTexture, { dimension: 'cube' });
      this.texturesBuffer.setSamplerInput(8, this.envMapEq.gpuSampler);
      this.texturesBuffer.setTextureInput(9, this.envMapEq.gpuTexture);
      this.texturesBuffer.allocate();
      this.texturesChanged = false;
    }

    return this.texturesBuffer;
  }

  getTexture(): Gfx3Texture {
    return this.texture;
  }

  getNormalMap(): Gfx3Texture {
    return this.normalMap;
  }

  getRoughnessMap(): Gfx3Texture {
    return this.roughnessMap;
  }

  getEnvMap(): Gfx3Texture {
    return this.envMap;
  }

  getEnvMapEq(): Gfx3Texture {
    return this.envMapEq;
  }
}

export { Gfx3Material };
import { gfx3Manager, UniformGroupDataset, UniformGroupBitmaps } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';

class MaterialTexture {
  texture: Gfx3Texture;
  transformMatrix: mat4;

  constructor(texture: Gfx3Texture) {
    this.texture = texture;
    this.transformMatrix = UT.MAT4_IDENTITY();
  }
};

type MaterialOptions = {
  opacity?: number,
  normalIntensity?: number,
  emissive?: vec3,
  diffuse?: vec3,
  ambiant?: vec3,
  specular?: vec4,
  lightning?: boolean,
  texture?: Gfx3Texture,
  normalMap?: Gfx3Texture,
  envMap?: Gfx3Texture,
  specularityMap?: Gfx3Texture;
};

class Gfx3Material {
  params: vec7_buf;
  emissive: vec3_buf;
  ambiant: vec3_buf;
  diffuse: vec3_buf;
  specular: vec4_buf;
  texture: Gfx3Texture;
  normalMap: Gfx3Texture;
  envMap: Gfx3Texture;
  specularityMap: Gfx3Texture;
  dataBuffer: UniformGroupDataset;
  dataChanged: boolean;
  texturesBuffer: UniformGroupBitmaps;
  texturesChanged: boolean;

  constructor(options: MaterialOptions) {
    this.params = new Float32Array(7);
    this.params[0] = options.opacity ?? 1;
    this.params[1] = options.normalIntensity ?? 1;
    this.params[2] = options.texture ? 1 : 0;
    this.params[3] = options.lightning ? 1 : 0;
    this.params[4] = options.normalMap ? 1 : 0;
    this.params[5] = options.envMap ? 1 : 0;
    this.params[6] = options.specularityMap ? 1 : 0;

    this.emissive = new Float32Array(options.emissive ?? [0.0, 0.0, 0.0]);
    this.diffuse = new Float32Array(options.diffuse ?? [1.0, 1.0, 1.0]);
    this.ambiant = new Float32Array(options.ambiant ?? [0.5, 0.5, 0.5]);
    this.specular = new Float32Array(options.specular ?? [0.0, 0.0, 0.0, 0.0]);
    this.texture = options.texture ?? gfx3Manager.createTextureFromBitmap();
    this.normalMap = options.normalMap ?? gfx3Manager.createTextureFromBitmap();
    this.envMap = options.envMap ?? gfx3Manager.createCubeMapFromBitmap();
    this.specularityMap = options.specularityMap ?? gfx3Manager.createTextureFromBitmap();

    this.dataBuffer = gfx3Manager.createUniformGroupDataset('MESH_PIPELINE', 2);
    this.dataBuffer.addInput(0, UT.F03_SIZE, 'MAT_EMISSIVE_COLOR');
    this.dataBuffer.addInput(1, UT.F03_SIZE, 'MAT_AMBIANT_COLOR');
    this.dataBuffer.addInput(2, UT.F03_SIZE, 'MAT_DIFFUSE_COLOR');
    this.dataBuffer.addInput(3, UT.F04_SIZE, 'MAT_SPECULAR');
    this.dataBuffer.addInput(4, UT.F07_SIZE, 'MAT_PARAMS');
    this.dataBuffer.allocate();
    this.dataChanged = true;

    this.texturesBuffer = gfx3Manager.createUniformGroupBitmaps('MESH_PIPELINE', 3);
    this.texturesBuffer.addSamplerInput(0, this.texture.gpuSampler);
    this.texturesBuffer.addTextureInput(1, this.texture.gpuTexture);
    this.texturesBuffer.addSamplerInput(2, this.specularityMap.gpuSampler);
    this.texturesBuffer.addTextureInput(3, this.specularityMap.gpuTexture);
    this.texturesBuffer.addSamplerInput(4, this.normalMap.gpuSampler);
    this.texturesBuffer.addTextureInput(5, this.normalMap.gpuTexture);
    this.texturesBuffer.addSamplerInput(6, this.envMap.gpuSampler);
    this.texturesBuffer.addTextureInput(7, this.envMap.gpuTexture, { dimension: 'cube' });
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

  setNormalIntensity(normalIntensity: number): void {
    this.params[1] = normalIntensity;
    this.dataChanged = true;
  }

  setEmissive(r: number, g: number, b: number): void {
    this.emissive[0] = r;
    this.emissive[1] = g;
    this.emissive[2] = b;
    this.dataChanged = true;
  }

  setDiffuse(r: number, g: number, b: number): void {
    this.diffuse[0] = r;
    this.diffuse[1] = g;
    this.diffuse[2] = b;
    this.dataChanged = true;
  }

  setAmbiant(r: number, g: number, b: number): void {
    this.ambiant[0] = r;
    this.ambiant[1] = g;
    this.ambiant[2] = b;
    this.dataChanged = true;
  }

  setSpecular(r: number, g: number, b: number): void {
    this.specular[0] = r;
    this.specular[1] = g;
    this.specular[2] = b;
    this.dataChanged = true;
  }

  setSpecularity(specularity: number): void {
    this.specular[3] = specularity;
    this.dataChanged = true;
  }

  setLightning(lightning: boolean): void {
    this.params[3] = lightning ? 1 : 0;
    this.dataChanged = true;
  }

  setTexture(texture: Gfx3Texture): void {
    this.texture = texture;
    this.params[2] = 1;
    this.texturesChanged = true;
  }

  setNormalMap(normalMap: Gfx3Texture): void {
    this.normalMap = normalMap;
    this.params[4] = 1;
    this.texturesChanged = true;
  }

  setEnvMap(envMap: Gfx3Texture): void {
    this.envMap = envMap;
    this.params[5] = 1;
    this.texturesChanged = true;
  }

  setSpecularityMap(specularityMap: Gfx3Texture): void {
    this.specularityMap = specularityMap;
    this.params[6] = 1;
    this.texturesChanged = true;
  }

  getDataBuffer(): UniformGroupDataset {
    if (this.dataChanged) {
      this.dataBuffer.beginWrite();
      this.dataBuffer.write(0, this.emissive);
      this.dataBuffer.write(1, this.ambiant);
      this.dataBuffer.write(2, this.diffuse);
      this.dataBuffer.write(3, this.specular);
      this.dataBuffer.write(4, this.params);
      this.dataBuffer.endWrite();
      this.dataChanged = false;
    }

    return this.dataBuffer;
  }

  getTexturesBuffer(): UniformGroupBitmaps {
    if (this.texturesChanged) {
      this.texturesBuffer.setSamplerInput(0, this.texture.gpuSampler);
      this.texturesBuffer.setTextureInput(1, this.texture.gpuTexture);
      this.texturesBuffer.setSamplerInput(2, this.specularityMap.gpuSampler);
      this.texturesBuffer.setTextureInput(3, this.specularityMap.gpuTexture);
      this.texturesBuffer.setSamplerInput(4, this.normalMap.gpuSampler);
      this.texturesBuffer.setTextureInput(5, this.normalMap.gpuTexture);
      this.texturesBuffer.setSamplerInput(6, this.envMap.gpuSampler);
      this.texturesBuffer.setTextureInput(7, this.envMap.gpuTexture, { dimension: 'cube' });
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

  getSpecularityMap(): Gfx3Texture {
    return this.specularityMap;
  }

  getEnvMap(): Gfx3Texture {
    return this.envMap;
  }
}

export { Gfx3Material };
import { eventManager } from '../core/event_manager.js';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { gfx3Manager, UniformGroupDataset, UniformGroupBitmaps } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';

interface MATAnimation {
  name: string;
  textures: Array<Gfx3Texture>;
  frameDuration: number;
};

interface MATOptions {
  animations?: Array<MATAnimation>;
  opacity?: number;
  normalIntensity?: number;
  lightning?: boolean;
  emissive?: vec3;
  ambiant?: vec3;
  diffuse?: vec3;  
  specular?: vec4;
  texture?: Gfx3Texture;
  textureScrollAngle?: number;
  textureScrollRate?: number;
  displacementMap?: Gfx3Texture;
  displacementMapScrollAngle?: number;
  displacementMapScrollRate?: number;
  displacementMapFactor?: number;
  specularityMap?: Gfx3Texture;
  normalMap?: Gfx3Texture;
  envMap?: Gfx3Texture;
};

class Gfx3Material {
  animations: Array<MATAnimation>;
  currentAnimation: MATAnimation | null;
  currentAnimationTextureIndex: number;
  looped: boolean;
  frameProgress: number;
  // -------------------------------------
  params: vec12_buf;
  colors: vec16_buf;
  texture: Gfx3Texture;
  textureScrollAngle: number;
  textureScrollRate: number;
  textureScroll: vec2_buf;
  displacementMap: Gfx3Texture;
  displacementMapScrollAngle: number;
  displacementMapScrollRate: number;
  displacementMapScroll: vec2_buf;
  specularityMap: Gfx3Texture;
  normalMap: Gfx3Texture;
  envMap: Gfx3Texture;
  // -------------------------------------
  dataBuffer: UniformGroupDataset;
  dataChanged: boolean;
  texturesBuffer: UniformGroupBitmaps;
  texturesChanged: boolean;

  constructor(options: MATOptions) {
    this.animations = options.animations ?? [];
    this.currentAnimation = null;
    this.currentAnimationTextureIndex = 0;
    this.looped = false;
    this.frameProgress = 0;

    this.params = new Float32Array(9);
    this.params[0] = options.opacity ?? 1;
    this.params[1] = options.normalIntensity ?? 1;
    this.params[2] = options.lightning ? 1 : 0;
    this.params[3] = options.texture ? 1 : 0;
    this.params[4] = options.displacementMap ? 1 : 0;
    this.params[5] = options.displacementMapFactor ?? 0;
    this.params[6] = options.specularityMap ? 1 : 0;
    this.params[7] = options.normalMap ? 1 : 0;
    this.params[8] = options.envMap ? 1 : 0;

    this.colors = new Float32Array(16);
    this.colors[0] = options.emissive ? options.emissive[0] : 0.0;
    this.colors[1] = options.emissive ? options.emissive[1] : 0.0;
    this.colors[2] = options.emissive ? options.emissive[2] : 0.0;
    this.colors[3] = 0.0;
    this.colors[4] = options.ambiant ? options.ambiant[0] : 0.5;
    this.colors[5] = options.ambiant ? options.ambiant[1] : 0.5;
    this.colors[6] = options.ambiant ? options.ambiant[2] : 0.5;
    this.colors[7] = 0.0;
    this.colors[8] = options.diffuse ? options.diffuse[0] : 1.0;
    this.colors[9] = options.diffuse ? options.diffuse[1] : 1.0;
    this.colors[10] = options.diffuse ? options.diffuse[2] : 1.0;
    this.colors[11] = 0.0;
    this.colors[12] = options.specular ? options.specular[0] : 0.0;
    this.colors[13] = options.specular ? options.specular[1] : 0.0;
    this.colors[14] = options.specular ? options.specular[2] : 0.0;
    this.colors[15] = options.specular ? options.specular[3] : 0.0;

    this.texture = options.texture ?? gfx3Manager.createTextureFromBitmap();
    this.textureScrollAngle = options.textureScrollAngle ?? 0;
    this.textureScrollRate = options.textureScrollRate ?? 0;
    this.textureScroll = new Float32Array(2);

    this.displacementMap = options.displacementMap ?? gfx3Manager.createTextureFromBitmap();
    this.displacementMapScrollAngle = options.displacementMapScrollAngle ?? 0;
    this.displacementMapScrollRate = options.displacementMapScrollRate ?? 0;
    this.displacementMapScroll = new Float32Array(2);

    this.specularityMap = options.specularityMap ?? gfx3Manager.createTextureFromBitmap();
    this.normalMap = options.normalMap ?? gfx3Manager.createTextureFromBitmap();
    this.envMap = options.envMap ?? gfx3Manager.createCubeMapFromBitmap();

    this.dataBuffer = gfx3Manager.createUniformGroupDataset('MESH_PIPELINE', 2);
    this.dataBuffer.addInput(0, UT.F16_SIZE, 'MAT_COLORS');
    this.dataBuffer.addInput(1, UT.F09_SIZE, 'MAT_PARAMS');
    this.dataBuffer.addInput(2, UT.F02_SIZE, 'MAT_TEXTURE_SCROLL');
    this.dataBuffer.addInput(3, UT.F02_SIZE, 'MAT_DISPLACEMENT_MAP_SCROLL'); 
    this.dataBuffer.allocate();
    this.dataChanged = true;

    this.texturesBuffer = gfx3Manager.createUniformGroupBitmaps('MESH_PIPELINE', 3);
    this.texturesBuffer.addSamplerInput(0, this.texture.gpuSampler);
    this.texturesBuffer.addTextureInput(1, this.texture.gpuTexture);
    this.texturesBuffer.addSamplerInput(2, this.displacementMap.gpuSampler);
    this.texturesBuffer.addTextureInput(3, this.displacementMap.gpuTexture);
    this.texturesBuffer.addSamplerInput(4, this.specularityMap.gpuSampler);
    this.texturesBuffer.addTextureInput(5, this.specularityMap.gpuTexture);
    this.texturesBuffer.addSamplerInput(6, this.normalMap.gpuSampler);
    this.texturesBuffer.addTextureInput(7, this.normalMap.gpuTexture);
    this.texturesBuffer.addSamplerInput(8, this.envMap.gpuSampler);
    this.texturesBuffer.addTextureInput(9, this.envMap.gpuTexture, { dimension: 'cube' });
    this.texturesBuffer.allocate();
    this.texturesChanged = false;
  }

  static async createFromFile(path: string): Promise<Gfx3Material> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'MAT') {
      throw new Error('Gfx3Material::loadFromFile(): File not valid !');
    }

    const animations = new Array<MATAnimation>();
    for (const obj of json['Animations']) {
      const animation: MATAnimation = {
        name: obj['Name'],
        textures: [],
        frameDuration: parseInt(obj['FrameDuration'])
      };

      for (const texturePath of obj['Textures']) {
        animation.textures.push(await gfx3TextureManager.loadTexture(texturePath));
      }

      animations.push(animation);
    }

    return new Gfx3Material({
      animations: animations,
      opacity: json['Opacity'],
      normalIntensity: json['NormalIntensity'],
      lightning: json['Lightning'],
      emissive: json['Emissive'],
      ambiant: json['Ambiant'],
      diffuse: json['Diffuse'],      
      specular: json['Specular'],
      texture: json['Texture'] ?? await gfx3TextureManager.loadTexture(json['Texture']),
      textureScrollAngle: json['TextureScrollAngle'],
      textureScrollRate: json['TextureScrollRate'],
      displacementMap: json['DisplacementMap'] ?? await gfx3TextureManager.loadTexture(json['DisplacementMap']),
      displacementMapScrollAngle: json['DisplacementMapScrollAngle'],
      displacementMapScrollRate: json['DisplacementMapScrollRate'],
      displacementMapFactor: json['DisplacementMapFactor'],
      specularityMap: json['SpecularityMap'] ?? await gfx3TextureManager.loadTexture(json['SpecularityMap']),
      normalMap: json['NormalMap'] ?? await gfx3TextureManager.loadTexture(json['NormalMap']),
      envMap: json['EnvMap'] ?? await gfx3TextureManager.loadTexture(json['EnvMap'])
    });
  }

  delete(): void {
    this.dataBuffer.destroy();
  }

  update(ts: number): void {
    if (this.textureScrollRate != 0) {
      this.textureScroll[0] += Math.cos(this.textureScrollAngle) * this.textureScrollRate * (ts / 1000);
      this.textureScroll[1] += Math.sin(this.textureScrollAngle) * this.textureScrollRate * (ts / 1000);
      this.dataChanged = true;
    }

    if (this.displacementMapScrollRate != 0) {
      this.displacementMapScroll[0] += Math.cos(this.displacementMapScrollAngle) * this.displacementMapScrollRate * (ts / 1000);
      this.displacementMapScroll[1] += Math.sin(this.displacementMapScrollAngle) * this.displacementMapScrollRate * (ts / 1000);
      this.dataChanged = true;
    }

    if (this.currentAnimation) {
      if (this.frameProgress >= this.currentAnimation.frameDuration) {
        if (this.currentAnimationTextureIndex == this.currentAnimation.textures.length - 1) {
          eventManager.emit(this, 'E_FINISHED');
          this.currentAnimationTextureIndex = this.looped ? 0 : this.currentAnimation.textures.length - 1;
          this.frameProgress = 0;
        }
        else {
          this.currentAnimationTextureIndex = this.currentAnimationTextureIndex + 1;
          this.frameProgress = 0;
        }
  
        this.texture = this.currentAnimation.textures[this.currentAnimationTextureIndex];
        this.params[3] = 1;
        this.texturesChanged = true;
        this.dataChanged = true;
      }
      else {
        this.frameProgress += ts;
      }
    }
  }

  play(animationName: string, looped: boolean = false, preventSameAnimation: boolean = false): void {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    const animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx3Material::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationTextureIndex = 0;
    this.looped = looped;
    this.frameProgress = 0;
  }

  setOpacity(opacity: number): void {
    this.params[0] = opacity;
    this.dataChanged = true;
  }

  setNormalIntensity(normalIntensity: number): void {
    this.params[1] = normalIntensity;
    this.dataChanged = true;
  }

  setLightning(lightning: boolean): void {
    this.params[2] = lightning ? 1 : 0;
    this.dataChanged = true;
  }

  setEmissive(r: number, g: number, b: number): void {
    this.colors[0] = r;
    this.colors[1] = g;
    this.colors[2] = b;
    this.dataChanged = true;
  }

  setAmbiant(r: number, g: number, b: number): void {
    this.colors[4] = r;
    this.colors[5] = g;
    this.colors[6] = b;
    this.dataChanged = true;
  }

  setDiffuse(r: number, g: number, b: number): void {
    this.colors[8] = r;
    this.colors[9] = g;
    this.colors[10] = b;
    this.dataChanged = true;
  }

  setSpecular(r: number, g: number, b: number): void {
    this.colors[12] = r;
    this.colors[13] = g;
    this.colors[14] = b;
    this.dataChanged = true;
  }

  setSpecularity(specularity: number): void {
    this.colors[15] = specularity;
    this.dataChanged = true;
  }

  setTexture(texture: Gfx3Texture, angle: number = 0, rate: number = 0): void {
    this.texture = texture;
    this.textureScrollAngle = angle;
    this.textureScrollRate = rate;
    this.params[3] = 1;
    this.texturesChanged = true;
    this.dataChanged = true;
  }

  setDisplacementMap(displacementMap0: Gfx3Texture, angle: number = 0, rate: number = 0, factor: number = 0): void {
    this.displacementMap = displacementMap0;
    this.displacementMapScrollAngle = angle;
    this.displacementMapScrollRate = rate;
    this.params[4] = 1;
    this.params[5] = factor;
    this.texturesChanged = true;
    this.dataChanged = true;
  }

  setSpecularityMap(specularityMap: Gfx3Texture): void {
    this.specularityMap = specularityMap;
    this.params[6] = 1;
    this.texturesChanged = true;
    this.dataChanged = true;
  }

  setNormalMap(normalMap: Gfx3Texture): void {
    this.normalMap = normalMap;
    this.params[7] = 1;
    this.texturesChanged = true;
    this.dataChanged = true;
  }

  setEnvMap(envMap: Gfx3Texture): void {
    this.envMap = envMap;
    this.params[8] = 1;
    this.texturesChanged = true;
    this.dataChanged = true;
  }

  getDataBuffer(): UniformGroupDataset {
    if (this.dataChanged) {
      this.dataBuffer.beginWrite();
      this.dataBuffer.write(0, this.colors);
      this.dataBuffer.write(1, this.params);
      this.dataBuffer.write(2, this.textureScroll);
      this.dataBuffer.write(3, this.displacementMapScroll);
      this.dataBuffer.endWrite();
      this.dataChanged = false;
    }

    return this.dataBuffer;
  }

  getTexturesBuffer(): UniformGroupBitmaps {
    if (this.texturesChanged) {
      this.texturesBuffer.setSamplerInput(0, this.texture.gpuSampler);
      this.texturesBuffer.setTextureInput(1, this.texture.gpuTexture);
      this.texturesBuffer.setSamplerInput(2, this.displacementMap.gpuSampler);
      this.texturesBuffer.setTextureInput(3, this.displacementMap.gpuTexture);
      this.texturesBuffer.setSamplerInput(4, this.specularityMap.gpuSampler);
      this.texturesBuffer.setTextureInput(5, this.specularityMap.gpuTexture);
      this.texturesBuffer.setSamplerInput(6, this.normalMap.gpuSampler);
      this.texturesBuffer.setTextureInput(7, this.normalMap.gpuTexture);
      this.texturesBuffer.setSamplerInput(8, this.envMap.gpuSampler);
      this.texturesBuffer.setTextureInput(9, this.envMap.gpuTexture, { dimension: 'cube' });
      this.texturesBuffer.allocate();
      this.texturesChanged = false;
    }

    return this.texturesBuffer;
  }

  getTexture(): Gfx3Texture {
    return this.texture;
  }

  getDisplacementMap(): Gfx3Texture {
    return this.displacementMap;
  }

  getSpecularityMap(): Gfx3Texture {
    return this.specularityMap;
  }

  getNormalMap(): Gfx3Texture {
    return this.normalMap;
  }

  getEnvMap(): Gfx3Texture {
    return this.envMap;
  }
}

export { Gfx3Material };
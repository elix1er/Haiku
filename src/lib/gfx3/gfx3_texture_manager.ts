import { gfx3Manager } from './gfx3_manager';
import { Gfx3Texture } from './gfx3_texture';

class Gfx3TextureManager {
  textures: Map<string, Gfx3Texture>;

  constructor() {
    this.textures = new Map<string, Gfx3Texture>();
  }

  async loadTexture(path: string): Promise<Gfx3Texture> {
    if (this.textures.has(path)) {
      return this.textures.get(path)!;
    }

    const res = await fetch(path);
    const img = await res.blob();
    const bitmap = await createImageBitmap(img);
    const texture = gfx3Manager.createTextureFromBitmap(bitmap);

    this.textures.set(path, texture);
    return texture;
  }

  async loadTexture8bit(path: string): Promise<Gfx3Texture> {
    if (this.textures.has(path)) {
      return this.textures.get(path)!;
    }
    const res = await fetch(path);
    const img = await res.blob();
    const bitmap = await createImageBitmap(img);
    const texture = gfx3Manager.createTextureFromBitmap(bitmap, true);
    this.textures.set(path, texture);
    return texture;
  }

  async loadCubemapTexture(path: string, extension: string): Promise<Gfx3Texture> {
    if (this.textures.has(path)) {
      return this.textures.get(path)!;
    }

    const dirs = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    const bitmaps: Array<ImageBitmap> = [];

    for (const dir of dirs) {
      const res = await fetch(path + dir + '.' + extension);
      const img = await res.blob();
      const bitmap = await createImageBitmap(img);
      bitmaps.push(bitmap);
    }

    const texture = gfx3Manager.createCubeMapFromBitmap(bitmaps);
    this.textures.set(path, texture);
    return texture;
  }

  deleteTexture(path: string): void {
    if (!this.textures.has(path)) {
      throw new Error('Gfx3TextureManager::deleteTexture(): The texture file doesn\'t exist, cannot delete !');
    }

    const texture = this.textures.get(path)!;
    texture.gpuTexture.destroy();
    this.textures.delete(path);
  }

  getTexture(path: string): Gfx3Texture {
    if (!this.textures.has(path)) {
      throw new Error('Gfx2TextureManager::getTexture(): The texture file doesn\'t exist, cannot get !');
    }

    return this.textures.get(path)!;
  }

  hasTexture(path: string): boolean {
    return this.textures.has(path);
  }

  releaseTextures(): void {
    for (const path of this.textures.keys()) {
      const texture = this.textures.get(path)!;
      texture.gpuTexture.destroy();
      this.textures.delete(path);
    }
  }
}

export { Gfx3TextureManager };
export const gfx3TextureManager = new Gfx3TextureManager();
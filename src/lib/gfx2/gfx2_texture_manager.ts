class Gfx2TextureManager {
  textures: Map<string, ImageBitmap>;

  constructor() {
    this.textures = new Map<string, ImageBitmap>();
  }

  async loadTexture(path: string): Promise<ImageBitmap> {
    if (this.textures.has(path)) {
      return this.textures.get(path)!;
    }

    const res = await fetch(path);
    const img = await res.blob();
    const bitmap = await createImageBitmap(img);
    this.textures.set(path, bitmap);
    return bitmap;
  }

  deleteTexture(path: string): void {
    if (!this.textures.has(path)) {
      throw new Error('Gfx2TextureManager::deleteTexture(): The texture file doesn\'t exist, cannot delete !');
    }

    this.textures.delete(path);
  }

  getTexture(path: string): ImageBitmap {
    if (!this.textures.has(path)) {
      throw new Error('Gfx2TextureManager::getTexture(): The texture file doesn\'t exist, cannot get !');
    }

    return this.textures.get(path)!;
  }

  releaseTextures(): void {
    for (const path of this.textures.keys()) {
      this.textures.delete(path);
    }
  }
}

export const gfx2TextureManager = new Gfx2TextureManager();
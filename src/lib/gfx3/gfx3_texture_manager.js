import { gfx3Manager } from './gfx3_manager.js';

class Gfx3TextureManager {
  constructor() {
    this.textures = {};
  }

  async loadTexture(path) {
    if (this.getTexture(path) != gfx3Manager.getDefaultTexture()) {
      return this.getTexture(path);
    }

    let res = await fetch(path);
    let img = await res.blob();
    let texture = gfx3Manager.createTextureFromBitmap(await createImageBitmap(img));

    this.textures[path] = texture;
    return texture;
  }

  deleteTexture(path) {
    if (!this.textures[path]) {
      throw new Error('Gfx3TextureManager::deleteTexture(): The texture file doesn\'t exist, cannot delete !');
    }

    this.textures[path].gpu.destroy();
    this.textures[path] = null;
    delete this.textures[path];
  }

  getTexture(path) {
    return this.textures[path] ? this.textures[path] : gfx3Manager.getDefaultTexture();
  }

  releaseTextures() {
    for (let path in this.textures) {
      this.textures[path].gpu.destroy();
      this.textures[path] = null;
      delete this.textures[path];
    }
  }
}

export const gfx3TextureManager = new Gfx3TextureManager();
import { gfx3Manager } from '../gfx3/gfx3_manager.js';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';

class Gfx3LifeBar extends Gfx3Drawable {
  constructor() {
    super();

    this.materialID = gfx3Manager.newMaterial([1.0,1.0,1.0,1.0] , gfx3TextureManager.getTexture(''), null);
  }

  updateLife(life, max, height)
  {
    let sizeX = 1.0;
    let halfSz = sizeX/2.0;

    let percent = life * 100 / max;

    this.clearVertices();

    this.defineVertex(-halfSz, 0, 0, 0.0, 0.0);
    this.defineVertex(percent / 100 -halfSz, 0, 0, 0.5, 0.0);
    this.defineVertex(-halfSz, height, 0, 0.0, 1.0);

    this.defineVertex(-halfSz, height, 0, 0.0, 1.0);
    this.defineVertex(percent / 100 -halfSz, 0, 0, 0.5, 0.0);
    this.defineVertex(percent / 100 -halfSz, height, 0, 0.5, 1.0);


    this.defineVertex(percent / 100 -halfSz, 0, 0, 0.5, 0.0);
    this.defineVertex(halfSz, 0, 0, 1.0, 0.0);
    this.defineVertex(percent / 100 - halfSz, height, 0, 0.5, 1.0);

    this.defineVertex(percent / 100 - halfSz, height, 0, 0.5, 1.0);
    this.defineVertex(halfSz, 0, 0, 1.0, 0.0);
    this.defineVertex(halfSz, height, 0, 1.0, 1.0);    

    this.commitVertices();
}

  draw() {
    gfx3Manager.drawMesh(this.getModelMatrix(),this.getNormalMatrix(), this.materialID,  this.bufferOffsetId, this.vertexCount, this.vertSize);

  }
  getColor() {
    let mat = gfx3Manager.findMaterial(this.materialID);

    if(mat === null)
      return null;

    return mat.color;
}
  getTexture() {
    let mat = gfx3Manager.findMaterial(this.materialID);

    if(mat === null)
      return null;

    return mat.texture;
  }
  getNormalMap() {
    let mat = gfx3Manager.findMaterial(this.materialID);

    if(mat === null)
      return null;

    return mat.normalmap;
  }

  setTexture(texture) {
    gfx3Manager.setMaterialTexture(this.materialID, texture);
  }
}

export {Gfx3LifeBar};


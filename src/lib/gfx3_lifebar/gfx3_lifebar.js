let { gfx3Manager } = require('../gfx3/gfx3_manager');
let { gfx3TextureManager } = require('../gfx3/gfx3_texture_manager');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');

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

    if(this.bufferOffsetId == 0)
      this.bufferOffsetId = gfx3Manager.getBufferRangeId( this.vertexCount * this.vertSize);

    gfx3Manager.commitBuffer(this.bufferOffsetId, this.vertices);
  }

  draw() {
    gfx3Manager.drawMesh(this);
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

module.exports.Gfx3LifeBar = Gfx3LifeBar;


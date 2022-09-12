let { gfx3Manager } = require('../gfx3/gfx3_manager');
let { gfx3TextureManager } = require('../gfx3/gfx3_texture_manager');
let { Utils } = require('../core/utils');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');

class Gfx3JSS extends Gfx3Drawable {
  constructor() {
    super();
    this.textureRect = [0, 0, 1, 1];
    this.offset = [0, 0];
    this.pixelsPerUnit = 100;
    this.billboardMode = false;
    this.texture = gfx3TextureManager.getTexture('');
  }

  update(ts) {
    let minX = 0;
    let minY = 0;
    let maxX = this.textureRect[2];
    let maxY = this.textureRect[3];
    let ux = (this.textureRect[0] / this.texture.gpu.width);
    let uy = (this.textureRect[1] / this.texture.gpu.height);
    let vx = (this.textureRect[0] + this.textureRect[2]) / this.texture.gpu.width;
    let vy = (this.textureRect[1] + this.textureRect[3]) / this.texture.gpu.height;

    this.clearVertices();
    this.defineVertex(minX, maxY, 0, ux, uy);
    this.defineVertex(minX, minY, 0, ux, vy);
    this.defineVertex(maxX, minY, 0, vx, vy);
    this.defineVertex(maxX, minY, 0, vx, vy);
    this.defineVertex(maxX, maxY, 0, vx, uy);
    this.defineVertex(minX, maxY, 0, ux, uy);
    this.commitVertices();
  }

  draw() {
    gfx3Manager.drawMesh(this.getModelMatrix(), this.vertexCount, this.vertices, this.texture);
  }

  getModelMatrix() {
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    
    if (this.billboardMode) {
      let view = gfx3Manager.getCurrentView();
      let viewMatrix = view.getCameraViewMatrix();
      matrix = Utils.MAT4_MULTIPLY(matrix, view.getCameraMatrix());
      matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(viewMatrix[12], viewMatrix[13], viewMatrix[14]));
    }

    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(this.rotation[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(1 / this.pixelsPerUnit, 1 / this.pixelsPerUnit, 0));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(-this.offset[0], -this.offset[1], 0));
    return matrix;
  }

  getTextureRect() {
    return this.textureRect;
  }

  setTextureRect(left, top, width, height) {
    this.textureRect = [left, top, width, height];
  }

  getOffset() {
    return this.offset;
  }

  setOffset(offsetX, offsetY) {
    this.offset = [offsetX, offsetY];
  }

  getPixelsPerUnit() {
    return this.pixelsPerUnit;
  }

  setPixelsPerUnit(pixelsPerUnit) {
    this.pixelsPerUnit = pixelsPerUnit;
  }

  setBillboardMode(billboardMode) {
    this.billboardMode = billboardMode;
  }

  getTexture() {
    return this.texture;
  }

  setTexture(texture) {
    this.texture = texture;
  }
}

module.exports.Gfx3JSS = Gfx3JSS;
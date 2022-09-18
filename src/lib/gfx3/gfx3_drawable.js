import { gfx3Manager } from './gfx3_manager.js';
import { Utils } from '../core/utils.js';
import { BoundingBox } from '../bounding_box/bounding_box.js';
class Gfx3Drawable {
  constructor() {
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.vertices = [];
    this.vertexCount = 0;
    this.previousVertexCount = 0;
    this.materialID = 0;
    this.vertSizeF = 14;
    this.vertSize = this.vertSizeF * 4;

    this.minV  = null;
    this.maxV  = null;
    
    this.bufferOffsetId = 0;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw(viewIndex) {
    // virtual method called during draw phase !
  }

  delete() {
    gfx3Manager.deleteVertexBufferRange(this.bufferOffsetId);
  }

  getPosition() {
    return this.position;
  }

  getPositionX() {
    return this.position[0];
  }

  getPositionY() {
    return this.position[1];
  }

  getPositionZ() {
    return this.position[2];
  }

  setPosition(x, y, z) {
    this.position = [x, y, z];
  }

  move(x, y, z) {
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
  }

  getRotation() {
    return this.rotation;
  }

  getRotationX() {
    return this.rotation[0];
  }

  getRotationY() {
    return this.rotation[1];
  }

  getRotationZ() {
    return this.rotation[2];
  }

  setRotation(x, y, z) {
    this.rotation = [x, y, z];
  }

  rotate(x, y, z) {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
  }

  getScale() {
    return this.scale;
  }

  getScaleX() {
    return this.scale[0];
  }

  getScaleY() {
    return this.scale[1];
  }

  getScaleZ() {
    return this.scale[2];
  }

  setScale(x, y, z) {
    this.scale = [x, y, z];
  }

  zoom(x, y, z) {
    this.scale[0] += x;
    this.scale[1] += y;
    this.scale[2] += z;
  }

  defineVertexNormal(x, y, z, tx, ty, nx, ny, nz) {
    this.vertices.push(x, y, z, tx, ty, nx, ny, nz, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    this.vertexCount++;
  }
  defineVertexTangeant(x, y, z, tx, ty, nx, ny, nz, vtx, vty, vtz, bx, by,bz) {
    this.vertices.push(x, y, z, tx, ty, nx, ny, nz, vtx, vty, vtz, bx, by , bz);
    this.vertexCount++;
  }
  defineVertex(x, y, z, tx, ty) {
    this.vertices.push(x, y, z, tx, ty, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    this.vertexCount++;
  }

  defineVertexColor(x, y, z, r, g, b) {
    this.vertices.push(x, y, z, r, g, b);
    this.vertexCount++;
  }

  clearVertices() {
    this.vertices = [];
    this.vertexCount = 0;
    this.previousVertexCount = this.vertexCount;
    this.minV  = null;
    this.maxV  = null;
  }


  commitVertices() {

    for(let n=this.previousVertexCount;n<this.vertexCount;n++)
    {
        if(this.minV==null){
          this.minV=[this.vertices[n* this.vertSizeF + 0],this.vertices[n* this.vertSizeF + 1],this.vertices[n* this.vertSizeF + 2], 1.0]
        }
        else
        {
          this.minV[0]=Math.min(this.minV[0], this.vertices[n* this.vertSizeF + 0]);
          this.minV[1]=Math.min(this.minV[1], this.vertices[n* this.vertSizeF + 1]);
          this.minV[2]=Math.min(this.minV[2], this.vertices[n* this.vertSizeF + 2]);
        }

        if(this.maxV==null){
          this.maxV=[this.vertices[n* this.vertSizeF + 0],this.vertices[n* this.vertSizeF + 1],this.vertices[n* this.vertSizeF + 2], 1.0];
        }
        else
        {
          this.maxV[0]=Math.max(this.maxV[0], this.vertices[n* this.vertSizeF + 0]);
          this.maxV[1]=Math.max(this.maxV[1], this.vertices[n* this.vertSizeF + 1]);
          this.maxV[2]=Math.max(this.maxV[2], this.vertices[n* this.vertSizeF + 2]);
        }          
    }

    if(this.bufferOffsetId === 0)
      this.bufferOffsetId = gfx3Manager.getBufferRangeId( this.vertexCount * this.vertSize);
      
    gfx3Manager.commitBuffer(this.bufferOffsetId, this.vertices);

    this.previousVertexCount = this.vertexCount;
  }

  getBoxPts()
  {
    return[   [this.minV[0],this.minV[1],this.minV[2], 1.0],
              [this.minV[0],this.maxV[1],this.minV[2], 1.0],
              [this.maxV[0],this.minV[1],this.minV[2], 1.0],
              [this.maxV[0],this.maxV[1],this.minV[2], 1.0],

              [this.minV[0],this.minV[1],this.maxV[2], 1.0],
              [this.minV[0],this.maxV[1],this.maxV[2], 1.0],
              [this.maxV[0],this.minV[1],this.maxV[2], 1.0],
              [this.maxV[0],this.maxV[1],this.maxV[2], 1.0]]
  }

  getBoundingBox()
  {
      let minV = null;
      let maxV = null;

      let pts = this.getBoxPts();
      let m = this.getModelMatrix();

      for(let pt of pts)
      {
        let tp = Utils.MAT4_MULTIPLY_BY_VEC4(m, pt);
        minV = Utils.VEC3_MIN(minV, tp);
        maxV = Utils.VEC3_MAX(maxV, tp);
      }

    return new BoundingBox( minV,  maxV);
  }

  getNormalMatrix(){
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(this.rotation[2]));
    return matrix;
  }

  getModelMatrix() {
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(this.rotation[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    return matrix;
  }

  getColor() {
    let mat = gfx3Manager.findMaterial(this.materialID);
    if(mat === null)
        return null;

    return mat.color;
  }
  setColor(r,g,b,a) {
    let mat = gfx3Manager.findMaterial(this.materialID);
    if(mat === null)
        return null;

    return mat.color=[r,g,b,a];
  }

  getAmbiant() {
    let mat = gfx3Manager.findMaterial(this.materialID);
    if(mat === null)
        return null;

    return mat.ambiant;
  }
  getSpecular() {
    let mat = gfx3Manager.findMaterial(this.materialID);
    if(mat === null)
        return null;

    return mat.specular;
  }

  getTexture() {
    let mat = gfx3Manager.findMaterial(this.materialID);
    
    if(mat === null)
      return null;

    return mat.texture;
  }

  getNormalMap(){
      let mat = gfx3Manager.findMaterial(this.materialID);
      if(mat === null)
          return null;

      return mat.normalmap;
  }
  
  setTexture(texture) {
    gfx3Manager.setMaterialTexture(this.materialID, texture);
  }

  setNormalMap(texture) {
    gfx3Manager.setNormalMapTexture( this.materialID, texture);
  }
}

export {Gfx3Drawable};
import { Utils } from '../core/utils.js';

class Gfx3Node {
  constructor(id) {
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.children = [];
    this.id = id;
    this.components = [];
    
  }
  getDrawable()
  {
    return null;
  }
  addChild(c)
  {
    this.children.push(c);
  }

  find(id)
  {
      if(this.id === id)
        return this;
      
      for(let child of this.children)
      {
        let found = child.find(id);
        if(found !== null)
          return found;
      }
      return null;
  }

  update(ts) {
    // virtual method called during update phase !

    for(let child of this.children)
    {
      child.update(ts);
    }
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

  addComponent(comp , tag)
  {
    if(typeof this.components[tag] == 'undefined')
      this.components[tag] = [comp];
    else
      this.components[tag].push(comp);
  }

  getComponent(tag)
  {
      return this.components[tag];
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
  
  getTotalBoundingBox(bounds, mat)
  {
      let m = this.getModelMatrix();
      var newmat;

      if(mat !== null)
        newmat = Utils.MAT4_MULTIPLY(mat, m);
      else
        newmat =  m;

      for(let child of this.children)
      {
        child.getTotalBoundingBox(bounds, newmat);
      }
  }

  getNodeBoundingBox(id, mat)
  {
      let m = this.getModelMatrix();
      var newmat;

      if(mat !== null)
        newmat = Utils.MAT4_MULTIPLY(mat, m);
      else
        newmat =  m;

      for(let child of this.children)
      {
        let found = child.getNodeBoundingBox(id, newmat);
        if(found !== null)
          return found;
      }
      return null;
  }

  delete()
  {
    for(let child of this.children)
    {
        child.delete();
    }
    this.children=[];
  }
  draw(parentMat, parentNMat )
  { 
    var mat,nmat;
    if(parentMat == null)
    {
      mat = this.getModelMatrix();
      nmat = this.getNormalMatrix();
    }
    else{
      mat = Utils.MAT4_MULTIPLY(parentMat, this.getModelMatrix());
      nmat =  Utils.MAT4_MULTIPLY(parentNMat, this.getNormalMatrix());
    }
    for(let child of this.children)
    {
        child.draw(mat, nmat);
    }
  }

}

export {Gfx3Node};
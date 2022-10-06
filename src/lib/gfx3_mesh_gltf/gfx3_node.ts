import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';
import { Utils } from '../core/utils.js';
import { Gfx3Transformable } from '../gfx3/gfx3_transformable';
import { Gfx3Material} from '../gfx3/gfx3_material';

class Gfx3Node extends Gfx3Transformable {

  id : Number;
  children : Array<Gfx3Node>;
  name : String;

  constructor(id : Number) {
    super();
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.children = [];
    this.id = id;
    this.name = "default";
  }
  

  addChild(c : Gfx3Node)
  {
    this.children.push(c);
  }

  find(id : Number): Gfx3Node | null
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

  findName(name : string): Gfx3Node | null
  {
      if(this.name === name)
        return this;
      
      for(let child of this.children)
      {
        let found = child.findName(name);
        if(found !== null)
          return found;
      }
      return null;
  }

  update(ts: Number) {
    // virtual method called during update phase !

    for(let child of this.children)
    {
      child.update(ts);
    }
  }

  getTotalBoundingBox(mat : mat4| null): Gfx3BoundingBox
  {
      let m = this.getTransformMatrix();
      var newmat;

      if(mat !== null)
        newmat = Utils.MAT4_MULTIPLY(mat, m);
      else
        newmat =  m;

      let totalBox = new Gfx3BoundingBox([0,0,0], [0,0,0]);

      for(let child of this.children)
      {
        let childbox = child.getTotalBoundingBox(newmat);

        if(totalBox == null)
          totalBox = childbox;
        else
          totalBox = totalBox.mergeOne(childbox);
      }

      return totalBox;
  }

  getNodeBoundingBox(id : Number, mat: mat4 | null) : Gfx3BoundingBox | null
  {
      let m = this.getTransformMatrix();
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

    this.children = [];
    this.name = "";
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.id = -1;
  }

  draw(parentMat : mat4 | null)
  { 

   
    const mat = (parentMat == null) ? this.getTransformMatrix() : Utils.MAT4_MULTIPLY(parentMat, this.getTransformMatrix());
  
    for(let child of this.children)
    {
      child.draw(mat);
    }
  }

  getMaterial(): Gfx3Material | null
  {
    return null;
  }

}

export {Gfx3Node};
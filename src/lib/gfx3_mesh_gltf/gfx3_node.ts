import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';
import { Utils } from '../core/utils.js';
import { Gfx3Transformable } from '../gfx3/gfx3_transformable';
import { Gfx3Material} from '../gfx3_mesh/gfx3_mesh_material';
import { Gfx3Mesh } from '../gfx3_mesh/gfx3_mesh';
import { gfx3MeshRenderer } from '../gfx3_mesh/gfx3_mesh_renderer';

class Gfx3Node extends Gfx3Transformable {

  id : Number;
  children : Array<Gfx3Node>;
  name : String;
  drawable : Gfx3Mesh | null;

  constructor(id : Number) {
    super();
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.children = [];
    this.id = id;
    this.name = "default";
    this.drawable = null;
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

  getTotalBoundingBox(mat : mat4 | null):Gfx3BoundingBox | null
  {
      let m = this.getTransformMatrix();
      var newmat;
      
      newmat = mat ? Utils.MAT4_MULTIPLY(m, mat) : m;

      let totalBox = this.drawable?this.drawable.boundingBox.transform(newmat) : null;

      for(let child of this.children)
      {
          let childbox = child.getTotalBoundingBox(newmat);

          if(totalBox == null)
            totalBox = childbox;
          else if(childbox != null)
            totalBox = totalBox.mergeOne(childbox!);
      }

      return totalBox;

  }


  getNodeBoundingBox(id : Number, mat: mat4):Gfx3BoundingBox | null
  {
    let m = this.getTransformMatrix();
    var newmat;
    
    if(mat !== null)
      newmat = Utils.MAT4_MULTIPLY(m, mat);
    else
      newmat =  m;

      if(this.id === id)
      {
          if((this.drawable)&&(this.drawable.boundingBox)){
            return this.drawable.boundingBox.transform(newmat);
          }
      }

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

    if(this.drawable !== null)
    {

      gfx3MeshRenderer.drawMesh(this.drawable, mat);
    }
  
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
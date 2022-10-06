import { Utils } from '../core/utils.js';
import { gfx3Manager } from '../gfx3/gfx3_manager.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';

import {Gfx3Node} from './gfx3_node.js'
import { Gfx3Material } from '../gfx3/gfx3_material.js';

class Gfx3DrawableNode extends Gfx3Node {
    drawable : Gfx3Drawable ;
    children : Array<Gfx3Node>;

    constructor(drawable: Gfx3Drawable, id : Number)
    {
      super(id);
      this.drawable = drawable;
      this.children = [];
    }
  
    draw(parentMat : mat4 | null)
    {
        var mat;
        if(parentMat == null)
        {
          mat = this.getTransformMatrix();
        }
        else{
          mat = Utils.MAT4_MULTIPLY(parentMat, this.getTransformMatrix());
        }

         if(this.drawable !== null)
        {
          gfx3Manager.renderer.drawMesh(this.drawable.meshId, mat, this.drawable.material);
        }
        for(let cnode of this.children)
        {
            cnode.draw(mat); 
        }
    }
  
    delete()
    {
      this.drawable.delete();
      super.delete();
      
    }
  
  
    getTotalBoundingBox(mat : mat4)
    {
        let m = this.getTransformMatrix();
        var newmat;
        
        if(mat !== null)
          newmat = Utils.MAT4_MULTIPLY(m, mat);
        else
          newmat =  m;

        let totalBox = this.drawable.boundingBox.transform(newmat);

        for(let child of this.children)
        {
            let childbox = child.getTotalBoundingBox(newmat);
            totalBox = totalBox.mergeOne(childbox);
        }

        return totalBox;

    }
  
  
    getNodeBoundingBox(id : Number, mat: mat4)
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

    getMaterial(): Gfx3Material
    {
      return this.drawable.material;
    }

  }
  export {Gfx3DrawableNode}
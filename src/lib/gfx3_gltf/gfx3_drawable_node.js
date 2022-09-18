import { Utils } from '../core/utils.js';
import { gfx3Manager } from '../gfx3/gfx3_manager.js';

import {Gfx3Node} from './gfx3_node.js'

class Gfx3DrawableNode extends Gfx3Node {
    constructor(drawable, id)
    {
      super(id);
      this.drawable = drawable;
    }
  
    draw()
    {
      gfx3Manager.drawMesh(this.getModelMatrix(), this.getNormalMatrix(), this.drawable.materialID, this.drawable.bufferOffsetId, this.drawable.vertexCount, this.drawable.vertSize);
      super.draw();
    }
  
    delete()
    {
      super.delete();
      gfx3Manager.deleteMaterial(this.drawable.materialID);
      this.drawable.delete();
      
    }
  
    getDrawable()
    {
      return this.drawable;
    }
  
    getTotalBoundingBox(bounds, mat)
    {
        let m = this.getModelMatrix();
        var newmat;
        
        if(mat !== null)
          newmat = Utils.MAT4_MULTIPLY(m, mat);
        else
          newmat =  m;
  
         let pts= this.drawable.getBoxPts();
         for(let pt of pts)
         {
            let tp = Utils.MAT4_MULTIPLY_BY_VEC4(newmat, pt);
            bounds.min = Utils.VEC3_MIN(bounds.min, tp);
            bounds.max = Utils.VEC3_MAX(bounds.max, tp);
         }        
            
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
        newmat = Utils.MAT4_MULTIPLY(m, mat);
      else
        newmat =  m;
  
        if(this.id === id)
        {
            let pts= this.drawable.getBoxPts();
            let minV = null;
            let maxV = null;
  
            for(pt of pts)
            {
                let tp = Utils.MAT4_MULTIPLY_BY_VEC4(newmat, pt);
  
                minV = Utils.VEC3_MIN(minV, tp);
                maxV = Utils.VEC3_MAX(maxV, tp);
          }
          return new BoundingBox(minV, maxV);
        }
  
        for(let child of this.children)
        {
          let found = child.getNodeBOundingBox(id, newmat);
          if(found !== null)
            return found;
        }
        return null;
    }
  }
  export {Gfx3DrawableNode}
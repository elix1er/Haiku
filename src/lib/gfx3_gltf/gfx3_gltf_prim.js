import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';
import { gfx3Manager } from '../gfx3/gfx3_manager.js';

class Gfx3GLTFPrimitive extends Gfx3Drawable {
    constructor() {
      super();

    }

    draw() {
      gfx3Manager.drawMesh(this.getModelMatrix(),this.getNormalMatrix(), this.materialID, this.vertices,this.bufferOffsetId, this.vertexCount, this.vertSize);
    }
    

  
  }

  export {Gfx3GLTFPrimitive};
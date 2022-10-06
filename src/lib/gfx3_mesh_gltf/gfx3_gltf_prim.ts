import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { gfx3Manager } from '../gfx3/gfx3_manager';

class Gfx3GLTFPrimitive extends Gfx3Drawable {
    constructor() {
      super();

    }

    draw() {

      gfx3Manager.renderer.drawMesh(this.meshId, this.getTransformMatrix(), this.material);

    }
    

  
  }

  export {Gfx3GLTFPrimitive};
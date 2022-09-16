import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';
import { gfx3Manager } from '../gfx3/gfx3_manager.js';

class Gfx3GLTFPrimitive extends Gfx3Drawable {
    constructor() {
      super();

    }

    draw() {
      gfx3Manager.drawMesh(this);
    }
    

  
  }

  export {Gfx3GLTFPrimitive};
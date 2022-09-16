const { Utils } = require('../core/utils');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');
let { gfx3Manager } = require('../gfx3/gfx3_manager');

class Gfx3GLTFPrimitive extends Gfx3Drawable {
    constructor() {
      super();

    }

    draw() {
      gfx3Manager.drawMesh(this);
    }
    

  
  }

  module.exports.Gfx3GLTFPrimitive = Gfx3GLTFPrimitive;
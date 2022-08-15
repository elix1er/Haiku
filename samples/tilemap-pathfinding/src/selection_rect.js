let { gfx2Manager } = require('./lib/gfx2/gfx2_manager');
let { Gfx2Drawable } = require('./lib/gfx2/gfx2_drawable');
// ---------------------------------------------------------------------------------------

class SelectionRect extends Gfx2Drawable {
  constructor() {
    super();
  }

  paint() {
    const ctx = gfx2Manager.getContext();
    ctx.fillStyle = 'rgba(225,225,225,0.5)';
    ctx.fillRect(0, 0, 16, 16);
  }
}

module.exports.SelectionRect = SelectionRect;
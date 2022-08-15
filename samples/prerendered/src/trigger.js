let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3Debug } = require('./lib/gfx3/gfx3_debug');
// ---------------------------------------------------------------------------------------

class Trigger extends Gfx3Drawable {
  constructor() {
    super();
    this.radius = 0;
    this.hovered = false;
    this.onEnterBlockId = '';
    this.onLeaveBlockId = '';
    this.onActionBlockId = '';
  }

  async loadFromData(data) {
    this.position[0] = data['PositionX'];
    this.position[1] = data['PositionY'];
    this.position[2] = data['PositionZ'];
    this.radius = data['Radius'];
    this.onEnterBlockId = data['OnEnterBlockId'];
    this.onLeaveBlockId = data['OnLeaveBlockId'];
    this.onActionBlockId = data['OnActionBlockId'];
  }

  draw() {
    Gfx3Debug.drawSphere(this.getModelMatrix(), this.radius, 2);
  }

  getRadius() {
    return this.radius;
  }

  isHovered() {
    return this.hovered;
  }

  setHovered(hovered) {
    this.hovered = hovered;
  }

  getOnEnterBlockId() {
    return this.onEnterBlockId;
  }

  getOnLeaveBlockId() {
    return this.onLeaveBlockId;
  }

  getOnActionBlockId() {
    return this.onActionBlockId;
  }
}

module.exports.Trigger = Trigger;
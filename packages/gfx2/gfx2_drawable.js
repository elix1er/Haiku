let { gfx2Manager } = require('./gfx2_manager');

class Gfx2Drawable {
  constructor() {
    this.position = [0, 0];
    this.rotation = 0;
    this.offset = [0, 0];
    this.visible = true;
  }

  getPosition() {
    return this.position;
  }

  getPositionX() {
    return this.position[0];
  }

  getPositionY() {
    return this.position[1];
  }

  setPosition(x, y) {
    this.position = [x, y];
  }

  getRotation() {
    return this.rotation;
  }

  setRotation(rotation) {
    this.rotation = rotation;
  }

  getOffset() {
    return this.offset;
  }

  getOffsetX() {
    return this.offset[0];
  }

  getOffsetY() {
    return this.offset[1];
  }

  setOffset(x, y) {
    this.offset = [x, y];
  }

  isVisible() {
    return this.visible;
  }

  setVisible(visible) {
    this.visible = visible;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw(ts) {
    if (!this.visible) {
      return;
    }

    let ctx = gfx2Manager.getContext();

    ctx.save();
    ctx.translate(-this.offset[0], -this.offset[1]);
    ctx.translate(this.position[0], this.position[1]);
    ctx.rotate(this.rotation);
    this.paint(ts);
    ctx.restore();
  }

  paint(ts) {
    // virtual method called during draw phase !
  }
}

module.exports.Gfx2Drawable = Gfx2Drawable;
let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3JAM } = require('./lib/gfx3_jam/gfx3_jam');
// ---------------------------------------------------------------------------------------

class Model extends Gfx3Drawable {
  constructor() {
    super();
    this.jam = new Gfx3JAM();
    this.radius = 0;
    this.onActionBlockId = '';
  }

  async loadFromData(data) {
    await this.jam.loadFromFile(data['JAMFile']);
    this.jam.setTexture(await gfx3TextureManager.loadTexture(data['TextureFile']));
    this.jam.play('IDLE', true);
    this.position[0] = data['PositionX'];
    this.position[1] = data['PositionY'];
    this.position[2] = data['PositionZ'];
    this.rotation[0] = data['RotationX'];
    this.rotation[1] = data['RotationY'];
    this.rotation[2] = data['RotationZ'];
    this.radius = data['Radius'];
    this.onActionBlockId = data['OnActionBlockId'];
  }

  update(ts) {
    this.jam.setPosition(this.position[0], this.position[1], this.position[2]);
    this.jam.setRotation(this.rotation[0], this.rotation[1], this.rotation[2]);
    this.jam.update(ts);
  }

  draw() {
    this.jam.draw();
  }

  getRadius() {
    return this.radius;
  }

  getOnActionBlockId() {
    return this.onActionBlockId;
  }
}

module.exports.Model = Model;
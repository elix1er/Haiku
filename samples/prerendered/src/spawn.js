let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3Debug } = require('./lib/gfx3/gfx3_debug');
// ---------------------------------------------------------------------------------------

class Spawn extends Gfx3Drawable {
  constructor() {
    super();
    this.name = '';
    this.direction = [0, 0];
    this.radius = 0.2;
  }

  async loadFromData(data) {
    this.name = data['Name'];
    this.position[0] = data['PositionX'];
    this.position[1] = data['PositionY'];
    this.position[2] = data['PositionZ'];
    this.direction[0] = data['DirectionX'];
    this.direction[1] = data['DirectionZ'];
  }

  draw() {
    Gfx3Debug.drawSphere(this.getModelMatrix(), this.radius, 2);
  }

  getName() {
    return this.name;
  }

  getDirection() {
    return this.direction;
  }

  getRadius() {
    return this.radius;
  }
}

module.exports.Spawn = Spawn;
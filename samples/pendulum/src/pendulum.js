let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Gfx3JSM } = require('./lib/gfx3_jsm/gfx3_jsm');
let { Gfx3Drawable } = require("./lib/gfx3/gfx3_drawable");

class Pendulum extends Gfx3Drawable {
  constructor() {
    super();
    this.cylinder = new Gfx3JSM();
    this.ball = new Gfx3JSM();
  }

  async init() {
    await this.cylinder.loadFromFile('./assets/jsms/cylinder.jsm');
    this.cylinder.setTexture(await gfx3TextureManager.loadTexture('./assets/jsms/pendulum.jpg'));
    this.cylinder.setRotation(0, 0, this.angle);

    await this.ball.loadFromFile('./assets/jsms/sphere.jsm');
    this.ball.setTexture(await gfx3TextureManager.loadTexture('./assets/jsms/pendulum.jpg'));
  }

  update(ts) {
    this.cylinder.setRotation(...this.getRotation())
    this.cylinder.setScale(...this.getScale());
    this.cylinder.setPosition(
      this.getPositionX() + this.getShiftX(),
      this.getPositionY() + this.getShiftY(),
      this.getPositionZ()
    );

    this.ball.setPosition(
      this.getPositionX() + 2 * this.getShiftX(),
      this.getPositionY() + 2 * this.getShiftY(),
      this.getPositionZ()
    );

    this.cylinder.update(ts);
    this.ball.update(ts);
  }

  draw() {
    this.cylinder.draw();
    this.ball.draw();
  }

  getShiftX() {
    return this.getScaleY() * Math.sin(this.getRotationZ())
  }

  getShiftY() {
    return -this.getScaleY() * Math.cos(this.getRotationZ())
  }

  getExtremity() {
    return [
      this.getPositionX() + 2 * this.getShiftX(),
      this.getPositionY() + 2 * this.getShiftY(),
      this.getPositionZ()
    ];
  }
}

module.exports.Pendulum = Pendulum;

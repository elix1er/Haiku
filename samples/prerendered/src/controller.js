let { eventManager } = require('./lib/core/event_manager');
let { inputManager } = require('./lib/input/input_manager');
let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Utils } = require('./lib/core/utils');
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3JAM } = require('./lib/gfx3_jam/gfx3_jam');
// ---------------------------------------------------------------------------------------

class Controller extends Gfx3Drawable {
  constructor() {
    super();
    this.jam = new Gfx3JAM();
    this.controllable = true;
    this.radius = 0;
    this.speed = 4;
  }

  async loadFromData(data) {
    await this.jam.loadFromFile(data['JAMFile']);
    this.jam.setTexture(await gfx3TextureManager.loadTexture(data['TextureFile']));
    this.radius = data['Radius'];
  }

  update(ts) {
    let moving = false;
    if (this.controllable) {
      let moveDir = Utils.VEC3_ZERO;
      if (inputManager.isKeyDown('ArrowLeft')) {
        moveDir = Utils.VEC3_LEFT;
        moving = true;
      }
      else if (inputManager.isKeyDown('ArrowRight')) {
        moveDir = Utils.VEC3_RIGHT;
        moving = true;
      }
      else if (inputManager.isKeyDown('ArrowUp')) {
        moveDir = Utils.VEC3_FORWARD;
        moving = true;
      }
      else if (inputManager.isKeyDown('ArrowDown')) {
        moveDir = Utils.VEC3_BACKWARD;
        moving = true;
      }
  
      if (moving) {
        let moveX = moveDir[0] * this.speed * (ts / 1000);
        let moveZ = moveDir[2] * this.speed * (ts / 1000);
        this.position[0] += moveX;
        this.position[2] += moveZ;
        this.rotation[1] = Utils.VEC2_ANGLE([moveDir[0], moveDir[2]]);
        eventManager.emit(this, 'E_MOVED', { moveX, moveZ });
      }
    }

    this.jam.setPosition(this.position[0], this.position[1], this.position[2]);
    this.jam.setRotation(this.rotation[0], this.rotation[1], this.rotation[2]);
    this.jam.play(moving ? 'RUN' : 'IDLE', true, true);
    this.jam.update(ts);
  }

  draw() {
    this.jam.draw();
  }

  handleKeyDownOnce(e) {
    if (!this.controllable) {
      return;
    }

    if (e.key == 'Enter') {
      let handPositionX = this.position[0] + Math.cos(this.rotation[1]) * this.radius + 0.5;
      let handPositionY = this.position[1];
      let handPositionZ = this.position[2] + Math.sin(this.rotation[1]) * this.radius + 0.5;
      eventManager.emit(this, 'E_ACTION', { handPositionX, handPositionY, handPositionZ });
    }
  }

  setControllable(controllable) {
    this.controllable = controllable;
  }

  getRadius() {
    return this.radius;
  }
}

module.exports.Controller = Controller;
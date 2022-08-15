let { eventManager } = require('./lib/core/event_manager');
let { inputManager } = require('./lib/input/input_manager');
let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3JAS } = require('./lib/gfx3_jas/gfx3_jas');
// ---------------------------------------------------------------------------------------
let { DIRECTION, DIRECTION_TO_VEC3, PIXEL_PER_UNIT } = require('./enums');
// ---------------------------------------------------------------------------------------

class Controller extends Gfx3Drawable {
  constructor() {
    super();
    this.jas = new Gfx3JAS();
    this.controllable = true;
    this.direction = DIRECTION.FORWARD;
    this.radius = 0;
    this.speed = 3;

    this.jas.setPixelsPerUnit(PIXEL_PER_UNIT);
    this.jas.setBillboardMode(true);
  }

  async loadFromData(data) {
    await this.jas.loadFromFile(data['JASFile']);
    this.jas.setTexture(await gfx3TextureManager.loadTexture(data['TextureFile']));
    this.jas.setOffset(data['OffsetX'], data['OffsetY']);
    this.radius = data['Radius'];
  }

  update(ts) {
    let moving = false;
    if (this.controllable) {      
      if (inputManager.isKeyDown('ArrowLeft')) {
        moving = true;
        this.direction = DIRECTION.LEFT;
      }
      else if (inputManager.isKeyDown('ArrowRight')) {
        moving = true;
        this.direction = DIRECTION.RIGHT;
      }
      else if (inputManager.isKeyDown('ArrowUp')) {
        moving = true;
        this.direction = DIRECTION.FORWARD;
      }
      else if (inputManager.isKeyDown('ArrowDown')) {
        moving = true;
        this.direction = DIRECTION.BACKWARD;
      }
  
      if (moving) {
        let moveX = DIRECTION_TO_VEC3[this.direction][0] * this.speed * (ts / 1000);
        let moveZ = DIRECTION_TO_VEC3[this.direction][2] * this.speed * (ts / 1000);
        this.position[0] += moveX;
        this.position[2] += moveZ;
        eventManager.emit(this, 'E_MOVED', { moveX, moveZ });
      }
    }

    let offsetY = this.jas.getOffsetY() / PIXEL_PER_UNIT;
    this.jas.setPosition(this.position[0], this.position[1] + offsetY, this.position[2]);
    this.jas.play(moving ? 'RUN_' + this.direction : 'IDLE_' + this.direction, true, true);
    this.jas.update(ts);
  }

  draw() {
    this.jas.draw();
  }

  handleKeyDownOnce(e) {
    if (!this.controllable) {
      return;
    }

    if (e.key == 'Enter') {
      let handPositionX = this.position[0] + DIRECTION_TO_VEC3[this.direction][0] * (this.radius + 0.5);
      let handPositionY = this.position[1];
      let handPositionZ = this.position[2] + DIRECTION_TO_VEC3[this.direction][2] * (this.radius + 0.5);
      eventManager.emit(this, 'E_ACTION', { handPositionX, handPositionY, handPositionZ });
    }
  }

  setControllable(controllable) {
    this.controllable = controllable;
  }

  setDirection(direction) {
    this.direction = direction;
  }

  getRadius() {
    return this.radius;
  }
}

module.exports.Controller = Controller;
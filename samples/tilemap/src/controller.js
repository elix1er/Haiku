let { eventManager } = require('./lib/core/event_manager');
let { inputManager } = require('./lib/input/input_manager');
let { gfx2TextureManager } = require('./lib/gfx2/gfx2_texture_manager');
let { Gfx2Drawable } = require('./lib/gfx2/gfx2_drawable');
let { Gfx2JAS } = require('./lib/gfx2_jas/gfx2_jas');
// ---------------------------------------------------------------------------------------

let DIRECTION = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD'
};

let DIRECTION_TO_VEC2 = {
  LEFT: [-1, 0],
  RIGHT: [1, 0],
  FORWARD: [0, -1],
  BACKWARD: [0, 1]
};

class Controller extends Gfx2Drawable {
  constructor() {
    super();
    this.jas = new Gfx2JAS();
    this.moving = false;
    this.direction = DIRECTION.FORWARD;
    this.speed = 2;
    this.width = 0;
    this.height = 0;
    this.collider1 = [0, 0];
    this.collider2 = [0, 0];
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    await this.jas.loadFromFile(json['JASFile']);
    this.jas.setTexture(await gfx2TextureManager.loadTexture(json['TextureFile']));
    this.jas.setOffset(json['OffsetX'], json['OffsetY']);
    this.width = json['Width'];
    this.height = json['Height'];
    this.collider1[0] = json['Collider1X'];
    this.collider1[1] = json['Collider1Y'];
    this.collider2[0] = json['Collider2X'];
    this.collider2[1] = json['Collider2Y'];
  }

  update(ts) {
    if (inputManager.isKeyDown('ArrowLeft')) {
      this.moving = true;
      this.direction = DIRECTION.LEFT;
    }
    else if (inputManager.isKeyDown('ArrowRight')) {
      this.moving = true;
      this.direction = DIRECTION.RIGHT;
    }
    else if (inputManager.isKeyDown('ArrowUp')) {
      this.moving = true;
      this.direction = DIRECTION.FORWARD;
    }
    else if (inputManager.isKeyDown('ArrowDown')) {
      this.moving = true;
      this.direction = DIRECTION.BACKWARD;
    }
    else {
      this.moving = false;
    }

    if (this.moving) {
      let prevPositionX = this.position[0];
      let prevPositionY = this.position[1];
      this.position[0] += DIRECTION_TO_VEC2[this.direction][0] * this.speed;
      this.position[1] += DIRECTION_TO_VEC2[this.direction][1] * this.speed;
      eventManager.emit(this, 'E_MOVED', { prevPositionX, prevPositionY });
    }

    this.jas.setPosition(this.position[0], this.position[1]);
    this.jas.play(this.moving ? 'RUN_' + this.direction : 'IDLE_' + this.direction, true, true);
    this.jas.update(ts);
  }

  draw() {
    this.jas.draw();
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getCollider1X() {
    return this.collider1[0];
  }

  getCollider1Y() {
    return this.collider1[1];
  }

  getCollider2X() {
    return this.collider2[0];
  }

  getCollider2Y() {
    return this.collider2[1];
  }
}

module.exports.Controller = Controller;
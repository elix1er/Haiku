import { eventManager } from '../../lib/core/event_manager';
import { inputManager } from '../../lib/input/input_manager';
import { gfx2TextureManager } from '../../lib/gfx2/gfx2_texture_manager';
import { Gfx2Drawable } from '../../lib/gfx2/gfx2_drawable';
import { Gfx2JAS } from '../../lib/gfx2_jas/gfx2_jas';
// ---------------------------------------------------------------------------------------

const DIRECTION = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD'
};

const DIRECTION_TO_VEC2 = {
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
    this.speed = 0.05;
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
    if (inputManager.isActiveAction('LEFT')) {
      this.moving = true;
      this.direction = DIRECTION.LEFT;
    }
    else if (inputManager.isActiveAction('RIGHT')) {
      this.moving = true;
      this.direction = DIRECTION.RIGHT;
    }
    else if (inputManager.isActiveAction('UP')) {
      this.moving = true;
      this.direction = DIRECTION.FORWARD;
    }
    else if (inputManager.isActiveAction('DOWN')) {
      this.moving = true;
      this.direction = DIRECTION.BACKWARD;
    }
    else {
      this.moving = false;
    }

    if (this.moving) {
      let prevPositionX = this.position[0];
      let prevPositionY = this.position[1];
      this.position[0] += DIRECTION_TO_VEC2[this.direction][0] * this.speed * ts;
      this.position[1] += DIRECTION_TO_VEC2[this.direction][1] * this.speed * ts;
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

export { Controller };
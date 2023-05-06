import { eventManager } from '../../lib/core/event_manager';
import { inputManager } from '../../lib/input/input_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { Gfx3Transformable } from '../../lib/gfx3/gfx3_transformable';
import { Gfx3SpriteJAS } from '../../lib/gfx3_sprite/gfx3_sprite_jas';
// ---------------------------------------------------------------------------------------
import { DIRECTION, DIRECTION_TO_VEC3, PIXEL_PER_UNIT } from './enums';
// ---------------------------------------------------------------------------------------

class Controller extends Gfx3Transformable {
  constructor() {
    super();
    this.jas = new Gfx3SpriteJAS();
    this.controllable = true;
    this.direction = DIRECTION.FORWARD;
    this.radius = 0;
    this.speed = 1;
    this.moving = false;

    this.jas.setPixelsPerUnit(PIXEL_PER_UNIT);
    this.jas.setBillboardMode(true);

    eventManager.subscribe(inputManager, 'E_ACTION_ONCE', this, this.handleActionOnce);
  }

  async loadFromData(data) {
    await this.jas.loadFromFile(data['JASFile']);
    this.jas.setTexture(await gfx3TextureManager.loadTexture(data['TextureFile']));
    this.jas.setOffset(data['OffsetX'], data['OffsetY']);
    this.radius = data['Radius'];
  }

  delete() {
    eventManager.unsubscribe(inputManager, 'INPUT_ACTION', this);
    this.jas.delete();
  }

  update(ts) {
    this.updateMove(ts);
    this.updateJas(ts);
  }

  updateMove(ts) {
    if (!this.controllable) {
      return;
    }

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
      let moveX = DIRECTION_TO_VEC3[this.direction][0] * this.speed * (ts / 1000);
      let moveZ = DIRECTION_TO_VEC3[this.direction][2] * this.speed * (ts / 1000);
      this.position[0] += moveX;
      this.position[2] += moveZ;
      eventManager.emit(this, 'E_MOVED', { moveX, moveZ });
    }
  }

  updateJas(ts) {
    let offsetY = this.jas.getOffsetY() / PIXEL_PER_UNIT;
    this.jas.setPosition(this.position[0], this.position[1] + offsetY, this.position[2]);
    this.jas.play(this.moving ? 'RUN_' + this.direction : 'IDLE_' + this.direction, true, true);
    this.jas.update(ts);
  }

  draw() {
    this.jas.draw();
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

  handleActionOnce(data) {
    if (!this.controllable) {
      return;
    }

    if (data.actionId == 'OK') {
      let handPositionX = this.position[0] + DIRECTION_TO_VEC3[this.direction][0] * (this.radius + 0.2);
      let handPositionY = this.position[1];
      let handPositionZ = this.position[2] + DIRECTION_TO_VEC3[this.direction][2] * (this.radius + 0.2);
      eventManager.emit(this, 'E_ACTION', { handPositionX, handPositionY, handPositionZ });
    }
  }
}

export { Controller };
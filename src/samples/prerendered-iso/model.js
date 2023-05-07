import { eventManager } from '../../lib/core/event_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { Gfx3Transformable } from '../../lib/gfx3/gfx3_transformable';
import { Gfx3SpriteJAS } from '../../lib/gfx3_sprite/gfx3_sprite_jas';
// ---------------------------------------------------------------------------------------
import { DIRECTION, DIRECTION_TO_VEC3, PIXEL_PER_UNIT } from './enums';
// ---------------------------------------------------------------------------------------

class Model extends Gfx3Transformable {
  constructor() {
    super();
    this.jas = new Gfx3SpriteJAS();
    this.radius = 0;
    this.direction = DIRECTION.FORWARD;
    this.velocity = [0, 0, 0];
    this.onActionBlockId = '';

    this.jas.setPixelsPerUnit(PIXEL_PER_UNIT);
    this.jas.setBillboardMode(true);
  }

  async loadFromData(data) {
    await this.jas.loadFromFile(data['JASFile']);
    this.jas.setTexture(await gfx3TextureManager.loadTexture(data['TextureFile']));
    this.jas.setOffset(data['OffsetX'], data['OffsetY']);
    this.position[0] = data['PositionX'];
    this.position[1] = data['PositionY'];
    this.position[2] = data['PositionZ'];
    this.radius = data['Radius'];
    this.onActionBlockId = data['OnActionBlockId'];
  }

  delete() {
    this.jas.delete();
  }

  update(ts) {
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
    this.position[2] += this.velocity[2];

    let offsetY = this.jas.getOffsetY() / PIXEL_PER_UNIT;
    this.jas.setPosition(this.position[0], this.position[1] + offsetY, this.position[2]);
    this.jas.update(ts);
  }

  draw() {
    this.jas.draw();
  }

  play(animationName, isLooped = false) {
    this.jas.play(animationName, isLooped);
  }

  move(mx, mz, direction = null) {
    this.velocity[0] = mx;
    this.velocity[1] = 0;
    this.velocity[2] = mz;

    if (mx != 0 || mz != 0) {
      this.direction = direction;
      this.jas.play('RUN_' + this.direction, true, true);
      eventManager.emit(this, 'E_MOVED', { moveX: mx, moveZ: mz });
    }
    else {
      this.jas.play('IDLE_' + this.direction, true, true);
    }
  }

  setVelocity(mx, my, mz) {
    this.velocity[0] = mx;
    this.velocity[1] = my;
    this.velocity[2] = mz;
  }

  setDirection(direction) {
    this.direction = direction;
    this.jas.play('IDLE_' + direction, true, true);
  }

  getRadius() {
    return this.radius;
  }

  getOnActionBlockId() {
    return this.onActionBlockId;
  }

  getNextPosition() {
    return [
      this.position[0] + this.velocity[0],
      this.position[1] + this.velocity[1],
      this.position[2] + this.velocity[2]
    ];
  }

  getHandPosition() {
    return [
      this.position[0] + DIRECTION_TO_VEC3[this.direction][0] * (this.radius + 0.2),
      this.position[1],
      this.position[2] + DIRECTION_TO_VEC3[this.direction][2] * (this.radius + 0.2)
    ];
  }
}

export { Model };
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { Gfx3Transformable } from '../../lib/gfx3/gfx3_transformable';
import { Gfx3SpriteJAS } from '../../lib/gfx3_sprite/gfx3_sprite_jas';
// ---------------------------------------------------------------------------------------
import { PIXEL_PER_UNIT } from './enums';
// ---------------------------------------------------------------------------------------

class Model extends Gfx3Transformable {
  constructor() {
    super();
    this.jas = new Gfx3SpriteJAS();
    this.radius = 0;
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

  getRadius() {
    return this.radius;
  }

  getOnActionBlockId() {
    return this.onActionBlockId;
  }
}

export { Model };
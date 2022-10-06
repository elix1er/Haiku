import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { Gfx3Transformable } from '../../lib/gfx3/gfx3_transformable';
import { Gfx3MeshJAM } from '../../lib/gfx3_mesh/gfx3_mesh_jam';
// ---------------------------------------------------------------------------------------

class Model extends Gfx3Transformable {
  constructor() {
    super();
    this.jam = new Gfx3MeshJAM();
    this.radius = 0;
    this.onActionBlockId = '';
  }

  async loadFromData(data) {
    await this.jam.loadFromFile(data['JAMFile']);
    this.jam.setMaterial({ texture: await gfx3TextureManager.loadTexture(data['TextureFile']) });
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

  delete() {
    this.jam.delete();
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

export { Model };
import { eventManager } from '../../lib/core/event_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { UT } from '../../lib/core/utils';
import { Gfx3Transformable } from '../../lib/gfx3/gfx3_transformable';
import { Gfx3MeshJAM } from '../../lib/gfx3_mesh/gfx3_mesh_jam';
import { Gfx3Material } from '../../lib/gfx3_mesh/gfx3_mesh_material';
// ---------------------------------------------------------------------------------------

class Model extends Gfx3Transformable {
  constructor() {
    super();
    this.jam = new Gfx3MeshJAM();
    this.radius = 0;
    this.velocity = [0, 0, 0];
    this.onActionBlockId = '';
  }

  async loadFromData(data) {
    await this.jam.loadFromFile(data['JAMFile']);
    this.jam.setMaterial(new Gfx3Material({ texture: await gfx3TextureManager.loadTexture(data['TextureFile']) }));
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
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
    this.position[2] += this.velocity[2];
    this.jam.setPosition(this.position[0], this.position[1], this.position[2]);
    this.jam.setRotation(this.rotation[0], this.rotation[1], this.rotation[2]);
    this.jam.update(ts);
  }

  draw() {
    this.jam.draw();
  }

  move(mx, mz) {
    this.velocity[0] = mx;
    this.velocity[1] = 0;
    this.velocity[2] = mz;

    if (mx != 0 || mz != 0) {
      this.rotation[1] = UT.VEC2_ANGLE([this.velocity[0], this.velocity[2]]);
      this.jam.play('RUN', true, true);
      eventManager.emit(this, 'E_MOVED', { moveX: mx, moveZ: mz });
    }
    else {
      this.jam.play('IDLE', true, true);
    }
  }

  setVelocity(mx, my, mz) {
    this.velocity[0] = mx;
    this.velocity[1] = my;
    this.velocity[2] = mz;
  }

  getRadius() {
    return this.radius;
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
      this.position[0] + Math.cos(this.rotation[1]) * this.radius + 0.5,
      this.position[1],
      this.position[2] + Math.sin(this.rotation[1]) * this.radius + 0.5
    ]
  }

  getOnActionBlockId() {
    return this.onActionBlockId;
  }
}

export { Model };
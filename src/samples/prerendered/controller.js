import { eventManager } from '../../lib/core/event_manager';
import { inputManager } from '../../lib/input/input_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { Utils } from '../../lib/core/utils';
import { Gfx3MeshJAM } from '../../lib/gfx3_mesh/gfx3_mesh_jam';
import { Gfx3Transformable } from '../../lib/gfx3/gfx3_transformable';
// ---------------------------------------------------------------------------------------

class Controller extends Gfx3Transformable {
  constructor() {
    super();
    this.jam = new Gfx3MeshJAM();
    this.controllable = true;
    this.radius = 0;
    this.speed = 4;

    eventManager.subscribe(inputManager, 'E_ACTION_ONCE', this, this.handleActionOnce);
  }

  async loadFromData(data) {
    await this.jam.loadFromFile(data['JAMFile']);
    this.jam.setMaterial({ texture: await gfx3TextureManager.loadTexture(data['TextureFile']) });
    this.radius = data['Radius'];
  }

  delete() {
    this.jam.delete();
    eventManager.unsubscribe(inputManager, 'E_ACTION_ONCE', this);
  }

  update(ts) {
    let moving = false;
    if (this.controllable) {
      let moveDir = Utils.VEC3_ZERO;
      if (inputManager.isActiveAction('LEFT')) {
        moveDir = Utils.VEC3_LEFT;
        moving = true;
      }
      else if (inputManager.isActiveAction('RIGHT')) {
        moveDir = Utils.VEC3_RIGHT;
        moving = true;
      }
      else if (inputManager.isActiveAction('UP')) {
        moveDir = Utils.VEC3_FORWARD;
        moving = true;
      }
      else if (inputManager.isActiveAction('DOWN')) {
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

  setControllable(controllable) {
    this.controllable = controllable;
  }

  getRadius() {
    return this.radius;
  }

  handleActionOnce(data) {
    if (!this.controllable) {
      return;
    }

    if (data.actionId == 'OK') {
      let handPositionX = this.position[0] + Math.cos(this.rotation[1]) * this.radius + 0.5;
      let handPositionY = this.position[1];
      let handPositionZ = this.position[2] + Math.sin(this.rotation[1]) * this.radius + 0.5;
      eventManager.emit(this, 'E_ACTION', { handPositionX, handPositionY, handPositionZ });
    }
  }
}

export { Controller };
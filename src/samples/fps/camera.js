import { eventManager } from '../../lib/core/event_manager';
import { uiManager } from '../../lib/ui/ui_manager';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { Gfx3BoundingBox } from '../../lib/gfx3/gfx3_bounding_box';
// ---------------------------------------------------------------------------------------

const EPSILON = 0.001;
const FRICTION = 0.5;
const ROTATION_SPEED = 0.003;

class Camera extends Gfx3Camera {
  constructor(viewIndex) {
    super(viewIndex);
    this.velocity = [0, 0, 0];
    this.aabb = new Gfx3BoundingBox();
    this.view.setPerspectiveNear(0.1);

    this.crosshair = document.createElement('img');
    this.crosshair.src = 'samples/fps/crosshair.png';
    uiManager.addNode(this.crosshair, 'position:absolute; left:50%; top:50%; transform: translate(-50%,-50%);');

    this.handleClickedCb = this.handleClicked.bind(this);
    this.handlePointerLockChangeCb = this.handlePointerLockChange.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);

    document.addEventListener('click', this.handleClickedCb);
    document.addEventListener('pointerlockchange', this.handlePointerLockChangeCb, false);
  }

  delete() {
    uiManager.removeNode(this.crosshair);
    document.removeEventListener('click', this.handleClickedCb);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChangeCb, false);
    document.removeEventListener('mousemove', this.handleMouseMoveCb);
  }

  update(ts) {
    this.translate(this.velocity[0], this.velocity[1], this.velocity[2]);
  }

  move(mx, my, mz) {
    if (mx != 0 || my != 0 || mz != 0) {
      this.velocity[0] = mx;
      this.velocity[1] = my;
      this.velocity[2] = mz;
    }
    else if (this.velocity[0] != 0 || this.velocity[2] != 0) {
      this.velocity[0] = (this.velocity[0] > -EPSILON && this.velocity[0] < EPSILON) ? 0 : this.velocity[0] * FRICTION;
      this.velocity[2] = (this.velocity[2] > -EPSILON && this.velocity[2] < EPSILON) ? 0 : this.velocity[2] * FRICTION;
    }

    eventManager.emit(this, 'E_MOVED', { moveX: this.velocity[0], moveY: this.velocity[1], moveZ: this.velocity[2] });
  }

  setVelocity(mx, my, mz) {
    this.velocity[0] = mx;
    this.velocity[1] = my;
    this.velocity[2] = mz;
  }

  getVelocity() {
    return this.velocity;
  }

  async handleClicked(e) {
    if (!document.pointerLockElement) {
      await document.body.requestPointerLock({
        unadjustedMovement: true,
      });
    }
  }

  handlePointerLockChange(e) {
    if (document.pointerLockElement == document.body) {
      document.addEventListener('mousemove', this.handleMouseMoveCb, false);
    }
    else {
      document.removeEventListener('mousemove', this.handleMouseMoveCb, false);
    }
  }

  handleMouseMove(e) {
    const newRotationY = e.movementX * ROTATION_SPEED;
    const newRotationX = e.movementY * ROTATION_SPEED;
    this.rotate(newRotationX, newRotationY, 0);
  }
}

export { Camera };
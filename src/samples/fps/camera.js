import { inputManager } from '../../lib/input/input_manager';
import { eventManager } from '../../lib/core/event_manager';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { UT } from '../../lib/core/utils';
import { Gfx3BoundingBox } from '../../lib/gfx3/gfx3_bounding_box';
// ---------------------------------------------------------------------------------------

const EPSILON = 0.001;
const FRICTION = 0.5;
const AABB_HALF_SIZE = 0.5;
const AABB_HALF_HEIGHT = 1;

class Camera extends Gfx3Camera {
  constructor() {
    super(0);
    this.lastMousePosition = [0, 0];
    this.velocity = [0, 0, 0];
    this.aabb = new Gfx3BoundingBox();



    var e = window.event;
    this.lastMousePosition[0] = e.clientX;
    this.lastMousePosition[1] = e.clientY;

    this.view.setPerspectiveNear(0.1);

    this.handleMouseMoveCb = this.handleMouseMove.bind(this);
    document.addEventListener('mousemove', this.handleMouseMoveCb);
  }

  delete() {
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

  handleMouseMove(e) {
    const newRotationY = (e.clientX - this.lastMousePosition[0]) * 0.003;
    const newRotationX = (e.clientY - this.lastMousePosition[1]) * 0.003;
    this.rotate(newRotationX, newRotationY, 0);
    this.lastMousePosition[0] = e.clientX;
    this.lastMousePosition[1] = e.clientY;
  }
}

export { Camera };
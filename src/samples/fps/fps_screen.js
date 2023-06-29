import { eventManager } from '../../lib/core/event_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { inputManager } from '../../lib/input/input_manager';
import { UT } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx3MeshJSM } from '../../lib/gfx3_mesh/gfx3_mesh_jsm';
import { Gfx3MeshNav } from '../../lib/gfx3_mesh/gfx3_mesh_nav';
import { Gfx3Material } from '../../lib/gfx3_mesh/gfx3_mesh_material';
// ---------------------------------------------------------------------------------------
import { Camera } from './camera';
// ---------------------------------------------------------------------------------------

const PLAYER_WIDTH = 1;
const PLAYER_HEIGHT = 1.3;
const PLAYER_SIZE = [PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_WIDTH];

const SPEED_MAX = 3;
const ACCEL_RATE = 1;

const GRAVITY_RATE = 1;
const GRAVITY_MAX = 10;

class FPSScreen extends Screen {
  constructor() {
    super();
    this.map = new Gfx3MeshJSM();
    this.nav = new Gfx3MeshNav();
    this.camera = new Camera(0);
    this.cameraSpeed = 0;
    this.cameraGravitySpeed = 0;
  }

  async onEnter() {
    this.camera.setPosition(-1.5, 1, 2.7);
    this.camera.setRotation(0, -Math.PI / 2, 0);

    await this.map.loadFromFile('./samples/fps/map.jsm');
    this.map.setMaterial(new Gfx3Material({ texture: await gfx3TextureManager.loadTexture('./samples/fps/map.png') }));
    this.nav.loadFromJSM(this.map);

    eventManager.subscribe(this.camera, 'E_MOVED', this, this.handleCameraMoved);
  }

  async onExit() {
    eventManager.unsubscribe(this.camera, 'E_MOVED', this);
  }

  update(ts) {
    const cameraAxies = this.camera.getLocalAxies();
    let moving = false;
    let dir = [0, 0];

    if (inputManager.isActiveAction('LEFT')) {
      dir[0] += cameraAxies[0][0] * -1;
      dir[1] += cameraAxies[0][2] * -1;
      moving = true;
    }

    if (inputManager.isActiveAction('RIGHT')) {
      dir[0] += cameraAxies[0][0];
      dir[1] += cameraAxies[0][2];
      moving = true;
    }

    if (inputManager.isActiveAction('UP')) {
      dir[0] += cameraAxies[2][0] * -1;
      dir[1] += cameraAxies[2][2] * -1;
      moving = true;
    }

    if (inputManager.isActiveAction('DOWN')) {
      dir[0] += cameraAxies[2][0];
      dir[1] += cameraAxies[2][2];
      moving = true;
    }

    const my = this.cameraGravitySpeed * -1 * (ts / 1000);

    if (moving) {
      this.cameraSpeed = this.cameraSpeed < SPEED_MAX ? this.cameraSpeed + ACCEL_RATE : SPEED_MAX;
      const ndir = UT.VEC2_NORMALIZE(dir);
      const mx = ndir[0] * this.cameraSpeed * (ts / 1000);
      const mz = ndir[1] * this.cameraSpeed * (ts / 1000);      
      this.camera.move(mx, my, mz);
    }
    else {
      this.cameraSpeed = 0;
      this.camera.move(0, my, 0);
    }

    this.camera.update(ts);
    this.map.update(ts);
  }

  draw() {
    this.map.draw();
  }

  handleCameraMoved({ moveX, moveY, moveZ }) {
    const navInfo = this.nav.move(this.camera.getPosition(), PLAYER_SIZE, [moveX, moveY, moveZ]);

    // console.log('navInfo:', navInfo.move[1]);

    if (navInfo.collideFloor) {
      this.cameraGravitySpeed = 0;
    }
    else {
      this.cameraGravitySpeed = this.cameraGravitySpeed < GRAVITY_MAX ? this.cameraGravitySpeed + GRAVITY_RATE : GRAVITY_MAX;
    }

    this.camera.setVelocity(navInfo.move[0], navInfo.move[1], navInfo.move[2]);
  }
}

export { FPSScreen };
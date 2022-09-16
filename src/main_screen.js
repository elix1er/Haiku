import { gfx3Manager } from './lib/gfx3/gfx3_manager.js';
import { gfx3TextureManager } from './lib/gfx3/gfx3_texture_manager.js';
import { inputManager } from './lib/input/input_manager.js';
import { Utils } from './lib/core/utils.js';
import { Screen } from './lib/screen/screen.js';
import { Gfx3JSM } from './lib/gfx3_jsm/gfx3_jsm.js';
import { Gfx3Debug } from './lib/gfx3/gfx3_debug.js';
// ---------------------------------------------------------------------------------------
let CAMERA_SPEED = 0.1;

class MainScreen extends Screen {
  constructor() {
    super();
    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];
    this.view = gfx3Manager.getView(0);
    this.cube = new Gfx3JSM();

    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleMouseUpCb = this.handleMouseUp.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);
  }

  async onEnter() {
    gfx3Manager.setShowDebug(true);

    await this.cube.loadFromFile('./assets/jsms/cube.jsm');
    this.cube.setPosition(0, 0, -8);
    this.cube.setTexture(await gfx3TextureManager.loadTexture('./assets/jsms/cube.jpg'));

    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);
  }

  async onExit() {
    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);
  }

  update(ts) {
    let cameraMatrix = this.view.getCameraMatrix();
    let move = [0, 0, 0];
    let moving = false;

    if (inputManager.isActiveAction('LEFT')) {
      move[0] += cameraMatrix[0] * CAMERA_SPEED * -1;
      move[1] += cameraMatrix[1] * CAMERA_SPEED * -1;
      move[2] += cameraMatrix[2] * CAMERA_SPEED * -1;
      moving = true;
    }

    if (inputManager.isActiveAction('RIGHT')) {
      move[0] += cameraMatrix[0] * CAMERA_SPEED * +1;
      move[1] += cameraMatrix[1] * CAMERA_SPEED * +1;
      move[2] += cameraMatrix[2] * CAMERA_SPEED * +1; 
      moving = true;
    }

    if (inputManager.isActiveAction('UP')) {
      move[0] += cameraMatrix[ 8] * CAMERA_SPEED * -1;
      move[1] += cameraMatrix[ 9] * CAMERA_SPEED * -1;
      move[2] += cameraMatrix[10] * CAMERA_SPEED * -1; 
      moving = true;
    }

    if (inputManager.isActiveAction('DOWN')) {
      move[0] += cameraMatrix[ 8] * CAMERA_SPEED * +1;
      move[1] += cameraMatrix[ 9] * CAMERA_SPEED * +1;
      move[2] += cameraMatrix[10] * CAMERA_SPEED * +1;
      moving = true;
    }

    if (moving) {
      this.view.move(move[0], move[1], move[2]);
    }

    let now = Date.now() / 1000;
    this.cube.setRotation(Math.sin(now), Math.cos(now), 0);
    this.cube.update(ts);
  }

  draw() {
    this.cube.draw();
    Gfx3Debug.drawGrid(Utils.MAT4_ROTATE_X(Math.PI * 0.5), 20, 1);
  }

  handleMouseDown(e) {    
    this.isDragging = true;
    this.dragStartPosition[0] = e.clientX;
    this.dragStartPosition[1] = e.clientY;
    this.dragStartRotation[0] = this.view.getRotationX();
    this.dragStartRotation[1] = this.view.getRotationY();
  }

  handleMouseUp() {
    this.isDragging = false;
  }

  handleMouseMove(e) {
    if (!this.isDragging) {
      return;
    }

    let newRotationX = this.dragStartRotation[0] + ((e.clientY - this.dragStartPosition[1]) * 0.001);
    let newRotationY = this.dragStartRotation[1] + ((e.clientX - this.dragStartPosition[0]) * 0.001);
    this.view.setRotation(newRotationX, newRotationY, 0);
  }
}

export { MainScreen };
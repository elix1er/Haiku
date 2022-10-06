import { inputManager } from '../../lib/input/input_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { gfx3DebugRenderer } from '../../lib/gfx3/gfx3_debug_renderer';
import { Utils } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { Gfx3MeshJSM } from '../../lib/gfx3_mesh/gfx3_mesh_jsm';

import { Gfx3Skybox } from '../../lib/gfx3_skybox/gfx3_skybox';
import { Gfx3GLTF } from '../../lib/gfx3_mesh_gltf/gfx3_gltf';

import { gfx3MeshRenderer } from '../../lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3MeshLightning } from '../../lib/gfx3_mesh/gfx3_mesh_lightning';
import { gfx3Manager } from '../../lib/gfx3/gfx3_manager';

// ---------------------------------------------------------------------------------------
const CAMERA_SPEED = 0.1;

class MainScreen extends Screen {
  constructor() {
    super();
    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];
    this.camera = new Gfx3Camera(0);
    this.cube = new Gfx3MeshJSM();
    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleMouseUpCb = this.handleMouseUp.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);

    this.skybox = new Gfx3Skybox();

    this.gltf = new Gfx3GLTF();

   

    this.lightning = new Gfx3MeshLightning();
    this.lightning.position=[1.5, 1, -6, 1.0];
    
  }

  async onEnter() {
    await this.cube.loadFromFile('./samples/real-time/cube.jsm');
    this.cube.setPosition(0, 0, -8);
    this.cube.setMaterial({ lightning:true, texture: await gfx3TextureManager.loadTexture('./samples/real-time/cube.jpg') });

    await this.gltf.loadFromFile("./gltf_0003/Duck.gltf");
    this.gltf.rootNode.setPosition(3, 0, -8);
    this.gltf.rootNode.setScale(0.01,0.01,0.01);
    this.gltf.rootNode.setRotation(0, Math.PI/2, 0)
    

    const duck = this.gltf.rootNode.findName("material blinn3-fx");

    const cm= await gfx3TextureManager.loadCubemapTexture('./samples/real-time/box_', 'png');

    this.skybox.setCubemap(cm);
    this.cube.material.envMap =cm;
    duck.drawable.material.envMap = cm;

    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);
  }

  onExit() {
    document.removeEventListener('mousedown', this.handleMouseDownCb);
    document.removeEventListener('mouseup', this.handleMouseUpCb);
    document.removeEventListener('mousemove', this.handleMouseMoveCb);
  }

  update(ts) {
    const cameraMatrix = this.camera.getTransformMatrix();
    const move = Utils.VEC3_CREATE(0, 0, 0);
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
      move[0] += cameraMatrix[8] * CAMERA_SPEED * -1;
      move[1] += cameraMatrix[9] * CAMERA_SPEED * -1;
      move[2] += cameraMatrix[10] * CAMERA_SPEED * -1;
      moving = true;
    }

    if (inputManager.isActiveAction('DOWN')) {
      move[0] += cameraMatrix[8] * CAMERA_SPEED * +1;
      move[1] += cameraMatrix[9] * CAMERA_SPEED * +1;
      move[2] += cameraMatrix[10] * CAMERA_SPEED * +1;
      moving = true;
    }

    if (moving) {
      this.camera.move(move[0], move[1], move[2]);
    }

    const now = Date.now() / 1000;
    this.cube.setRotation(Math.sin(now), Math.cos(now), 0);
    this.cube.update(ts);

    gfx3MeshRenderer.lightning = this.lightning;
   
    this.gltf.rootNode.rotate(0, ts / 1000,  0);
    this.gltf.update(ts);
  }

  draw() {
    this.cube.draw();
    this.gltf.rootNode.draw();
    this.skybox.draw();
    gfx3DebugRenderer.drawGrid(Utils.MAT4_ROTATE_X(Math.PI * 0.5), 200, 10);

    const box = this.gltf.rootNode.getTotalBoundingBox()

    gfx3DebugRenderer.drawBoundingBox(Utils.MAT4_IDENTITY(), box.min, box.max );
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStartPosition[0] = e.clientX;
    this.dragStartPosition[1] = e.clientY;
    this.dragStartRotation[0] = this.camera.getRotationX();
    this.dragStartRotation[1] = this.camera.getRotationY();
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
    this.camera.setRotation(newRotationX, newRotationY, 0);
  }
}

export { MainScreen };
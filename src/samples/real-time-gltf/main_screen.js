import { eventManager } from '../../lib/core/event_manager';
import { inputManager } from '../../lib/input/input_manager';
import { uiManager } from '../../lib/ui/ui_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { gfx3DebugRenderer } from '../../lib/gfx3/gfx3_debug_renderer';
import { Utils } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { Gfx3MeshJSM } from '../../lib/gfx3_mesh/gfx3_mesh_jsm';
import { Gfx3Skybox } from '../../lib/gfx3_skybox/gfx3_skybox';
import { Gfx3MeshGLTF } from '../../lib/gfx3_mesh_gltf/gfx3_mesh_gltf';
import { Gfx3MeshLightning } from '../../lib/gfx3_mesh/gfx3_mesh_lightning';
import { UIMenuText } from '../../lib/ui_menu_text/ui_menu_text';
// ---------------------------------------------------------------------------------------
const CAMERA_SPEED = 0.1;

class MainScreen extends Screen {
  constructor() {
    super();

    this.camera = new Gfx3Camera(0);
    this.cube = new Gfx3MeshJSM();
    this.skybox = new Gfx3Skybox();
    this.lightning = new Gfx3MeshLightning();
    this.gltf = new Gfx3MeshGLTF();

    this.uiMenu = new UIMenuText();

    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];
    this.gltfList = [];

    this.handleMenuHoverCb = this.handleMenuHover.bind(this);
    this.handleRootClickCb = this.handleRootClick.bind(this);
    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleMouseUpCb = this.handleMouseUp.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);
  }

  async onEnter() {
    {
      this.lightning.setPosition(1.5, 1, -6, 1.0);
      this.skybox.setCubemap(await gfx3TextureManager.loadCubemapTexture('./samples/real-time/box_', 'png'));
    }

    {
      const response = await fetch('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/model-index.json');
      const json = await response.json();
  
      for (let i in json) {
        this.gltfList.push({ name: json[i].name, gltf: json[i].variants['glTF'], base: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/' });
        this.uiMenu.add(i, json[i].name);
      }
  
      const url = this.gltfList[9].base + '/' + this.gltfList[9].name + '/glTF/' + this.gltfList[9].gltf;
      this.gltf = new Gfx3MeshGLTF();
      this.gltf.setScale(0.01, 0.01, 0.01);
      await this.gltf.loadFromFile(url);
  
      uiManager.addWidget(this.uiMenu, 'position:absolute; left:10px; bottom:10px; width:350px; height:200px');
      uiManager.focus(this.uiMenu);
    }

    {
      const canvas = document.querySelector('#UI_ROOT');
      canvas.addEventListener('click', this.handleRootClickCb);

      document.addEventListener('mousedown', this.handleMouseDownCb);
      document.addEventListener('mouseup', this.handleMouseUpCb);
      document.addEventListener('mousemove', this.handleMouseMoveCb);

      eventManager.subscribe(this.uiMenu, 'E_ITEM_SELECTED', this, this.handleMenuItemSelected);
      eventManager.subscribe(this.uiMenu, 'E_CLOSED', this, this.handleMenuClosed);
    }
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

    if (moving && !this.uiMenu.isFocused()) {
      this.camera.move(move[0], move[1], move[2]);
    }

    this.gltf.update(ts);
  }

  draw() {
    this.gltf.draw();
    this.skybox.draw();
    // this.lightning.draw();
    gfx3DebugRenderer.drawGrid(Utils.MAT4_ROTATE_X(Math.PI * 0.5), 20, 1);
  }

  handleMenuHover(e) {
    uiManager.focus(this.uiMenu);
  }

  handleRootClick(e) {
    const menuNode = this.uiMenu.getNode();
    menuNode.addEventListener('mouseover', this.handleMenuHoverCb, { once: true });
    uiManager.unfocus();
  }

  handleMenuClosed() {
    this.uiMenu.unfocus();
  }

  handleMenuItemSelected(data) {
    const url = this.gltfList[data.id].base + '/' + this.gltfList[data.id].name + '/glTF/' + this.gltfList[data.id].gltf;
    const gltf = new Gfx3MeshGLTF();
    gltf.setScale(0.01, 0.01, 0.01);
    gltf.loadFromFile(url).then(() => {
      this.gltf = gltf;
    });
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
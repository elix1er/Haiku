import { eventManager } from '../../lib/core/event_manager';
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
import { UIMenuText } from '../../lib/ui_menu_text/ui_menu_text';
import { uiManager } from '../../lib/ui/ui_manager';

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

    this.uiMenu1 = new UIMenuText();
    this.uiMenuAlpha = [];
    this.currentAlpha = -1;

    this.skybox = new Gfx3Skybox();
    this.gltfs = [];
    this.gltfList = [];

    this.lightning = new Gfx3MeshLightning();
    this.lightning.position=[1.5, 1, -6, 1.0];
    
  }

  handleMenu2ItemSelected(data) {
    //uiManager.focus(this.uiMenu2);

    const GLTFUrl = this.gltfList[data.id].base + '/'+this.gltfList[data.id].name+'/glTF/' +this.gltfList[data.id].gltf;
    
    const newGLTF = new Gfx3GLTF();
    newGLTF.loadFromFile(GLTFUrl);
    this.gltfs.push(newGLTF);
  }

  handleMenu2Closed() {
    this.uiMenuAlpha[this.currentAlpha].unselectWidgets();

    eventManager.unsubscribe( this.uiMenuAlpha[this.currentAlpha], 'E_CLOSED', this);
    eventManager.unsubscribe( this.uiMenuAlpha[this.currentAlpha], 'E_ITEM_SELECTED', this);

    uiManager.removeWidget( this.uiMenuAlpha[this.currentAlpha]);
    this.currentAlpha=-1;

    uiManager.focus(this.uiMenu1);

  }

  handleMenu1ItemSelected(data) {

    this.uiMenu1.unselectWidgets();

    if(this.currentAlpha>=0)
        uiManager.removeWidget( this.uiMenuAlpha[this.currentAlpha]);
    
    this.currentAlpha=data.id;

    console.log(this.uiMenuAlpha[this.currentAlpha]);


    uiManager.addWidget(this.uiMenuAlpha[this.currentAlpha], 'position:absolute; top: 0px; left:10%; bottom:0; width : 40%');
    uiManager.focus(this.uiMenuAlpha[this.currentAlpha]);

    eventManager.subscribe(this.uiMenuAlpha[this.currentAlpha], 'E_CLOSED', this, this.handleMenu2Closed);
    eventManager.subscribe(this.uiMenuAlpha[this.currentAlpha], 'E_ITEM_SELECTED', this, this.handleMenu2ItemSelected);
    
    
  }
  async onEnter() {


    const list = await fetch("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/model-index.json");
    const GLLTFS =  await list.json();

    for(let i in GLLTFS)
    {

        this.gltfList.push({ name :  GLLTFS[i].name, gltf : GLLTFS[i].variants["glTF"], base: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/"});

        const alpha = GLLTFS[i].name[0];
        const aidx  = GLLTFS[i].name.charCodeAt(0);

        if(this.uiMenuAlpha[aidx] == undefined){
            this.uiMenu1.add(aidx, alpha);
            this.uiMenuAlpha[aidx] = new UIMenuText();

            
        }
            
        this.uiMenuAlpha[aidx].add(i, GLLTFS[i].name);


    }

    uiManager.addWidget(this.uiMenu1, 'position:absolute; top:0px; left: 0 ; bottom:0; width:10%');
    uiManager.focus(this.uiMenu1);
  
    const cm= await gfx3TextureManager.loadCubemapTexture('./samples/real-time/box_', 'png');

    this.skybox.setCubemap(cm);

    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);

    eventManager.subscribe(this.uiMenu1, 'E_ITEM_SELECTED', this, this.handleMenu1ItemSelected);
    eventManager.subscribe(this.uiMenu1, 'E_CLOSED', this, this.handleMenu2Closed);
    
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

    gfx3MeshRenderer.lightning = this.lightning;

    for(let gltf of this.gltfs)
    {
        gltf.update(ts);
    }
   
  }

  draw() {

    for(let gltf of this.gltfs)
    {
        gltf.draw();
    }

    this.skybox.draw();
    gfx3DebugRenderer.drawGrid(Utils.MAT4_ROTATE_X(Math.PI * 0.5), 200, 10);

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
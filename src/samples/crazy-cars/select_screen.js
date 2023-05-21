import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { gfx2TextureManager } from '../../lib/gfx2/gfx2_texture_manager';

import { gfx3DebugRenderer } from '../../lib/gfx3/gfx3_debug_renderer';
import { inputManager } from '../../lib/input/input_manager';
import { UT } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { Gfx3MeshObj } from '../../lib/gfx3_mesh/gfx3_mesh_obj';
import { Gfx3Skybox } from '../../lib/gfx3_skybox/gfx3_skybox';
import { gfx3Manager } from '../../lib/gfx3/gfx3_manager';
import { gfx2Manager } from '../../lib/gfx2/gfx2_manager';
import { gfx3MeshRenderer } from '../../lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3MeshShapeCylinder } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_cylinder';
import { Gfx3MeshShapeSphere } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_sphere';



import { CircuitRace, initWallet } from './cc.js';
import { Gfx3Material } from '../../lib/gfx3_mesh/gfx3_mesh_material';
import { Gfx3Mesh } from '../../lib/gfx3_mesh/gfx3_mesh';
import { UISprite } from '../../lib/ui_sprite/ui_sprite';
import { UIText } from '../../lib/ui_text/ui_text';
import { Gfx2SpriteJAS } from '../../lib/gfx2_sprite/gfx2_sprite_jas'
import { UIWidget } from '../../lib/ui/ui_widget';
import { uiManager } from '../../lib/ui/ui_manager';


import { MenuAxis } from '../../lib/ui_menu/ui_menu';
import { UIMenuListView } from '../../lib/ui_menu_list_view/ui_menu_list_view';
import { eventManager } from '../../lib/core/event_manager';

import { TrackSelect } from './games_screen';

import { screenManager } from '../../lib/screen/screen_manager';
import { ArrayCollection } from '../../lib/core/array_collection';

import { InPlace } from './inplace';
import {UIPaginedMenuListView } from './ui_pagined_listview'

// ---------------------------------------------------------------------------------------
const CAMERA_SPEED = 0.1;

class PlayBtn extends UIWidget {
  constructor() {
    super({
      className: 'UIAccount',
      template: `<button>play</button>`
    });
  }

}

class UIAccount extends UIWidget {
    constructor() {
      super({
        className: 'UIAccount',
        template: `
        <div id="navbar-account"></div>
        <div id="my-balance"></div>
        <div id="my-steel-balance"></div>
        <div class="form-check" id="network-div">
            <input class="form-check-input" type="checkbox" value="testnet" id="my-network" onchange="const net = this.checked?'testnet':'mainnet'; wallet.setNetwork(net);" >
            <label class="form-check-label" for="flexCheckDefault">testnet</label>
        </div>
        <span id="endpoints" >v</span>`
      });
  
      this.hero = null;
    }
}


class UICar extends UIWidget {

  constructor() {
    super({className:'car-item',
    template:`
        <div class="car-item-header">
          <img class="store-icon" src=""> <!-- /assets/img/atomichub.png --!>
          <h5 class="car-name"></h5>
        </div>
        <div class="car-item-body">
          <img class="nft-image" src="#">
          <div style="padding-left:20px">
            <img class="nft-mounted-tire" src="#">
            <img class="nft-mounted-engine" src="#">
          </div>
          <div class="damage-bar">
            <div class="damage-bar-inner" id="damages-1099511627776" style="width: 100%;"></div>
          </div>
        </div>
    `

    });
    this.car = null;
    
  }

  setItem(c)
  {
    this.car = c;
    this.setId('car-'+c.id+'-'+c.type);
  }


  
  update(ts) {
    if (this.car) {

      const img = wallet.getAssetImage(this.car, 'cars');;

      this.node.querySelector('.store-icon').src = this.car.type == 1 ? wallet.site+'/assets/img/atomichub.png' : wallet.site+'/assets/img/simplemarket.svg';
      this.node.querySelector('.car-name').textContent = this.car.name;
      this.node.querySelector('.nft-image').src = wallet.site + '/assets/nfts/' + img;

      

      if(this.car.suspension)
      {
        const timg = wallet.getAssetImage(this.car.suspension, 'tires');
        this.node.querySelector('.nft-mounted-tire').src = wallet.site + '/assets/nfts/' + timg;
      }
      else
        this.node.querySelector('.nft-mounted-tire').src = wallet.site + '/assets/img/notire.png' ;

      if(this.car.motor)
      {
        const mimg = wallet.getAssetImage(this.car.motor, 'motors');
        this.node.querySelector('.nft-mounted-engine').src = wallet.site + '/assets/nfts/' + mimg;
      }
      else
        this.node.querySelector('.nft-mounted-engine').src = wallet.site + '/assets/img/nomotor.png';

      
    } else {
      this.node.querySelector('.store-icon').src = '#';
      this.node.querySelector('.car-name').textContent = '--';
      this.node.querySelector('.nft-image').src = '#';
    }
  }
  car;
}


class UICarList extends UIPaginedMenuListView {
  constructor(nPages) {
    super(nPages);
    
  }

  addItem(item, enabled = true, index = -1) {
    let widget = new UICar();
    widget.setItem(item);
    this.myWidgets.push(widget);
  }
}


class CCScreen extends Screen {
  constructor() {
    super();


    this.camera = new Gfx3Camera(0);


    this.skybox = new Gfx3Skybox();

    this.playBtn = new PlayBtn();
    this.carList = new UICarList(4);
    this.AccountUI = new UIAccount();

    this.cameraAngle = 0;

    this.camera.setPosition(0, 4.5, -8);
    this.camera.lookAt(0,0,0);

    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];


    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleMouseUpCb = this.handleMouseUp.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);

    this.handleKeyDownCb = this.handleKeyDown.bind(this);
    this.handleKeyUpCb = this.handleKeyUp.bind(this);

    this.site = 'https://crazy-cars.io';
    //this.site = 'http://localhost';
    this.world = new CircuitRace();


    this.hiddenObjects = [];
    gfx3Manager.views[0].setPerspectiveFar(700);
    gfx3Manager.views[0].setPerspectiveNear(0.1);
    gfx3Manager.views[0].setPerspectiveFovy(0.8);
    

    this.lightDir = UT.VEC3_CREATE(0, -1, -1.0);

    this.selectedServer = 0;
    this.trackName = 'circuit 003';

    this.camMode = 1;
    this.lastCamAngle = null;
    
    this.gameStat = 0;
    this.gameMessage = '';
    this.webSocket = null;
    this.intro = 0;
    this.mode = 0;

    this.a = 0;

    this.keysActions = {
      "KeyW": 'acceleration',
      "KeyS": 'braking',
      "KeyA": 'left',
      "KeyD": 'right',
      "ArrowUp": 'acceleration',
      "ArrowDown": 'braking',
      "ArrowLeft": 'left',
      "ArrowRight": 'right',
      "ControlLeft": "nitro",
      "ControlRight": "nitro"
    };
    this.pressed = {};

    this.digitsTex=[];
    this.digits=[];

    
  }

  
  
  getObjMat (obj, parent = null, parentNorm = null)
  {
    //const angles = UT.QUAT_TO_EULER(UT.VEC4_CREATE(quat.x, quat.y, quat.z, quat.w), "YXZ");

    
    UT.MAT4_TRANSLATE(obj.pos.x, obj.pos.y, obj.pos.z, obj.matrix);

    if(obj.quat)
    {
      obj.nmatrix = UT.MAT4_IDENTITY();
      InPlace.MAT4_MULTIPLY_BY_QUAT(obj.nmatrix, obj.quat.x, obj.quat.y, obj.quat.z, obj.quat.w);
      UT.MAT4_MULTIPLY(obj.matrix, obj.nmatrix, obj.matrix);
    }

    if(obj.scale)
    {
      InPlace.MAT4_SCALE(obj.matrix, obj.scale.x, obj.scale.y, obj.scale.z);
      InPlace.MAT4_SCALE(obj.nmatrix, obj.scale.x, obj.scale.y, obj.scale.z);
    }

    if(parent != null)
    {
      UT.MAT4_MULTIPLY(parent, obj.matrix, obj.matrix);
      UT.MAT4_MULTIPLY(parentNorm, obj.nmatrix, obj.nmatrix);
    }
  }




  async loadPod() {

    this.podMesh = new Gfx3MeshShapeCylinder(3, 2, 64,UT.VEC2_CREATE(1,1));
    const podTex = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/tiles_0042_color_1k.jpg");
    const podNormals = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/tiles_0042_normal_opengl_1k.png");
    this.podMat = new Gfx3Material({texture:podTex, normalMap:podNormals, lightning:true});

    this.podMesh.setMaterial(this.podMat);
 }

  async loadCar(car, pos) {

    car.ChassisMesh = new Gfx3MeshObj();
    await car.ChassisMesh.loadFromFile(this.site + "/assets/mesh/" + car.carDef.chassis + ".obj", this.site + "/assets/mesh/" + car.carDef.chassis + ".mtl")


    if (car.carDef.suspension) {

      car.tireMesh = new Gfx3MeshObj();
      await car.tireMesh.loadFromFile(this.site + "/assets/mesh/" + car.carDef.suspension.tire + ".obj", this.site + "/assets/mesh/" + car.carDef.suspension.tire + ".mtl")
    }

    car.pos.x=pos[0];
    car.pos.y=pos[1];
    car.pos.z=pos[2];

    const bbox = car.ChassisMesh.getBoundingBox();

    car.chassisWidth = bbox.max[0] - bbox.min[0];
    car.chassisHeight = bbox.max[1] - bbox.min[1];
    car.chassisLength = bbox.max[2] - bbox.min[2];

    car.center = UT.VEC3_CREATE(bbox.min[0] + car.chassisWidth / 2, bbox.min[1] + car.chassisHeight / 2, bbox.min[2] + car.chassisLength / 2);
    car.matrix = UT.MAT4_IDENTITY();

    this.getObjMat(car);
    
    car.updateWheels();

    for (let n = 0; n < 4; n++) {
      car.wheels[n].matrix = UT.MAT4_IDENTITY();
      car.wheels[n].nmatrix = UT.MAT4_IDENTITY();

      this.getObjMat(car.wheels[n],car.matrix,car.nmatrix);
    }

    car.massVehicle = car.carDef.massVehicle;

  }

  initCar(car)
  {
    
    this.getObjMat(car);

    for (let i = 0; i < car.wheels.length; i++) {
        car.wheels[i].matrix = UT.MAT4_IDENTITY();
        this.getObjMat(car.wheels[i]);
    }
    
    for (const obj of car.ChassisMesh) {
      obj[1].material.envMapEq = this.skyTexture;
      obj[1].material.lightning = true;
    }
  }

  async updateCarList()
  {
    const self=this;
    this.carImgs = [];

    if(this.wallet.myAccount == null)
    {
      this.carList.clear();
      this.carList.setPage(0);
      return;
    }

    this.wallet.getAssets(['cars']).then(()=>{

      const a = new ArrayCollection();
      for(let c of this.wallet.assetLists['cars'])
      {
        a.push(c);
        //this.carList.addItem(c, true, n++);
      }
      this.carList.setCollection(a);
      this.carList.setPage(0);
      /*
        let n=0;
        for(let c of this.wallet.assetLists['cars'])
        {
          this.carList.addItem(c, true, n++);
        }
      */
    });
  }

  onLogin()
  {
    this.updateCarList();
  }

  onLogout()
  {
    this.carList.myWidgets=[];
    this.updateCarList();
    this.setCar(1,-1);

  }

  async setCar(id,type)
  {
    this.world.myCar = null;


    const carDef = await this.wallet.getCar(id,type);
    const newCar = await this.world.createCar(carDef);
    await this.loadCar(newCar, UT.VEC3_CREATE(0,1,0));

    this.initCar(newCar);


    const img = wallet.getAssetImage(carDef, 'cars');;
    this.selectedCar.loadTexture(this.site + "/assets/nfts/"+img);
    
    this.world.myCar=newCar;
  }

  handleCarFocused(data){

    for(let e of document.querySelectorAll('[id^="car-"]')){ e.style.border = '1px solid #000';  }

    const widget = this.carList.widgets[data.index];

    widget.node.style.border = '10px solid #0F0';
    widget.node.querySelector('.nft-image').style.animationPlayState = 'running';

  }
  
  handleCarSelected(data){
    const a  = data.id.split('-');
    const self = this;
    this.playBtn.setVisible(false);

    fetch(this.site + '/selectCar?carid='+a[1]+'&type='+a[2]+'&to=none', { method: 'GET', credentials: 'include' , cache: "no-store"}).then(async(ab)=>{
      const b = await ab.text();
      self.setCar(parseInt(a[1]), parseInt(a[2]));
      this.playBtn.setVisible(true);
    });
    
  }
  async onEnter() {

    const self=this;

    uiManager.addWidget(this.AccountUI, 'position:absolute; top:0; left:0; right:0; height:50px;');

    this.wallet = await initWallet(this.site);
    this.wallet.engine = this;
    this.wallet.world = this.world;

    this.wallet.onLogin = function(){self.onLogin()};
    this.wallet.onLogout = function(){self.onLogout()};

    window.wallet = this.wallet;

    if(!this.wallet.myAccount)
    {
        const a = await fetch(this.site + '/selectCar?carid=1&type=-1&to=none', { method: 'GET', credentials: 'include', cache: "no-store" });
        const b = await a.blob();
    }

    this.selectedCar = new UISprite();
    await this.selectedCar.loadTexture(this.site + "/assets/nfts/car2.png");
    uiManager.addWidget(this.selectedCar, 'position:absolute; top:15px; left: 85%; right:0; height:80px; width:80px;background-size: contain;');

    uiManager.addWidget(this.playBtn, 'position:absolute; left:70%; top:45px; height:50px;');

    this.playBtn.getNode().addEventListener('click', function(){
      //screenManager.requestSetScreen(new PlayScreen(), { });
      screenManager.requestSetScreen(new TrackSelect(), { });
      
    })

    const response = await fetch(this.site + '/myCar', { method: 'GET', credentials: 'include' , cache: "no-store" });
    const data = await response.json();
    if (data.error) {
      return;
    }

    eventManager.subscribe(this.carList, 'E_ITEM_FOCUSED', this, this.handleCarFocused);
    eventManager.subscribe(this.carList, 'E_ITEM_SELECTED', this, this.handleCarSelected);
  
    uiManager.focus(this.carList);

    uiManager.addWidget(this.carList, 'position:absolute; top:380px; left:0; right:0; height:220px; width:100%;');

    if(this.wallet.myAccount)
    {
        this.updateCarList();
    }
    
    
    
    this.skyTexture = await gfx3TextureManager.loadTexture(this.site + "/assets/skybox/lobby.jpg");
    this.skySphere = new Gfx3MeshShapeSphere(300, 8, 8, UT.VEC2_CREATE(1,1));
    this.skySphere.material.texture = this.skyTexture;

    //gfx3MeshRenderer.setShadowSourceProj(600, 200);

    await this.loadPod();
    await this.setCar(data.result.id, data.result.type);

    

    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);

    document.addEventListener('keydown', this.handleKeyDownCb);
    document.addEventListener('keyup', this.handleKeyUpCb);

  }

  delCar(car)
  {
    if(car.ChassisMesh)
    {
      car.ChassisMesh.destroy();
      car.ChassisMesh = null;
    }

    if(car.tireMesh)
    {
      car.tireMesh.destroy();
      car.tireMesh = null;
    }
  }

  onExit() {

    if(this.world.myCar)
    {
      this.delCar(this.world.myCar);
      this.world.myCar=null;
    }
      
    if(this.podMesh)
    {
      this.podMesh.delete();
      this.podMesh = null;
    }

    if(this.skySphere)
    {
      this.skySphere.delete();
      this.skySphere=null;
    }

    uiManager.removeWidget(this.carList.nextPageIcon);
    uiManager.removeWidget(this.carList.prevPageIcon);
    uiManager.removeWidget(this.carList.pageCntText);
    
    this.carList.delete();
    
    uiManager.removeWidget(this.carList);
    uiManager.removeWidget(this.playBtn);

    uiManager.removeWidget(this.selectedCar);
    uiManager.removeWidget(this.AccountUI);


    

    document.removeEventListener('mousedown', this.handleMouseDownCb);
    document.removeEventListener('mouseup', this.handleMouseUpCb);
    document.removeEventListener('mousemove', this.handleMouseMoveCb);

    document.removeEventListener('keydown', this.handleKeyDownCb);
    document.removeEventListener('keyup', this.handleKeyUpCb);

  }



  update(ts) {
    const now = new Date().getTime();

    //gfx3MeshRenderer.enableShadowSource(UT.VEC3_CREATE(0,20,10), UT.VEC3_CREATE(0, 0, 0));
    

   
    if (this.world.myCar) {

        this.world.myCar.matrix = UT.MAT4_IDENTITY();
        this.world.myCar.nmatrix =  UT.MAT4_IDENTITY();
        InPlace.MAT4_MULTIPLY_BY_QUAT(this.world.myCar.nmatrix, this.world.myCar.quat.x, this.world.myCar.quat.y, this.world.myCar.quat.z, this.world.myCar.quat.w);
        InPlace.MAT4_ROTATE_Y(this.world.myCar.nmatrix, this.a);

        UT.MAT4_TRANSLATE(this.world.myCar.pos.x, this.world.myCar.pos.y, this.world.myCar.pos.z, this.world.myCar.matrix);
        UT.MAT4_MULTIPLY(this.world.myCar.matrix,this.world.myCar.nmatrix, this.world.myCar.matrix);

        this.world.myCar.updateWheels();

        for (let n = 0; n < 4; n++) {
            
            this.world.myCar.wheels[n].matrix = UT.MAT4_IDENTITY();
            this.world.myCar.wheels[n].nmatrix = UT.MAT4_IDENTITY();
      
            this.getObjMat(this.world.myCar.wheels[n], this.world.myCar.matrix, this.world.myCar.nmatrix);

            if(this.world.myCar.wheels[n].pos.x>0)
                InPlace.MAT4_ROTATE_Y(this.world.myCar.wheels[n].matrix, Math.PI)              ;
        }

        if (this.world.myCar.ChassisMesh) {
        
        for (const obj of this.world.myCar.ChassisMesh) {
          obj[1].update(ts);
        }
      }

      if (this.world.myCar.tireMesh) {
        for (const obj of this.world.myCar.tireMesh) {
          obj[1].update(ts);
        }
      }
    }

    if(this.podMesh)
    {
        this.podMesh.rotation[1] = this.a;
        this.podMesh.update(ts);
    }

    

    this.camera.position[0]= Math.cos(this.cameraAngle) * 9.1;
    this.camera.position[2]= Math.sin(this.cameraAngle) * 9.1;
    this.camera.lookAt(0,0,0);

    this.a+=ts / 1000.0;
    if(this.skySphere)
    {
      this.skySphere.position[0] = this.camera.position[0];
      this.skySphere.position[1] = this.camera.position[1];
      this.skySphere.position[2] = this.camera.position[2];
    }
  }



  draw() {

    gfx3MeshRenderer.enableDirLight(this.lightDir);

    gfx3MeshRenderer.dirLightColor= UT.VEC4_CREATE(0.6, 0.6,  0.6, 1.0);

    /*
    gfx3MeshRenderer.pointLight0Color= UT.VEC4_CREATE(0.0, 0.0, 0.02, 2.0);
    gfx3MeshRenderer.pointLight1Color= UT.VEC4_CREATE(0.02, 0.02, 0.00, 2.0);

    gfx3MeshRenderer.enablePointLight(UT.VEC4_CREATE(-1,1,0), 0);
    gfx3MeshRenderer.enablePointLight(UT.VEC4_CREATE(1,1,0), 1);
    */

    
    if (this.world.myCar) {
      
        if (this.world.myCar.ChassisMesh) {
          for (const obj of this.world.myCar.ChassisMesh) {
            gfx3MeshRenderer.drawMesh(obj[1], this.world.myCar.matrix);
          }
          const ofs = InPlace.QUAT_MULTIPLY_BY_VEC3([this.world.myCar.quat.x, this.world.myCar.quat.y, this.world.myCar.quat.z, this.world.myCar.quat.w], UT.VEC3_CREATE(-this.world.myCar.chassisWidth /2, 0, this.world.myCar.chassisLength + 0.2 ));
          const p=UT.VEC3_CREATE(this.world.myCar.pos.x + ofs[0] , this.world.myCar.pos.y + 2, this.world.myCar.pos.z+ ofs[2]);
          
        }
  
        if (this.world.myCar.tireMesh) {
          for (let w of this.world.myCar.wheels) {
            for (const obj of this.world.myCar.tireMesh) {
              gfx3MeshRenderer.drawMesh(obj[1], w.matrix);
            }
          }
        }
    }
    

    if(this.podMesh)
    {
      this.podMesh.draw();
    }

    if(this.skySphere)
      this.skySphere.draw();

    //this.skybox.draw();
    //gfx3DebugRenderer.drawGrid(UT.MAT4_ROTATE_X(Math.PI * 0.5), 20, 1);
  }


  handleKeyUp(e) {

    /*
    if(e.code === 'KeyS')
    {
      if(gfx3Manager.enableShadowPass)
        gfx3Manager.enableShadowPass = false;
      else
        gfx3Manager.enableShadowPass = true;
    }
    */
      
  }

  handleKeyDown(e) {
    
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStartPosition[0] = e.clientX;
    this.dragStartPosition[1] = e.clientY;

    this.dragStartRotation[0] = this.camera.getRotationX();
    this.dragStartRotation[1] =  this.cameraAngle;
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

    this.cameraAngle = newRotationY;
    //this.camera.setRotation(newRotationX, newRotationY, 0);
    

  }
}

export { CCScreen };
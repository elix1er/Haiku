import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { gfx2TextureManager } from '../../lib/gfx2/gfx2_texture_manager';

import { gfx3DebugRenderer } from '../../lib/gfx3/gfx3_debug_renderer';
import { inputManager } from '../../lib/input/input_manager';
import { UT } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { Gfx3MeshObj } from '../../lib/gfx3_mesh/gfx3_obj';
import { Gfx3Skybox } from '../../lib/gfx3_skybox/gfx3_skybox';
import { gfx3Manager } from '../../lib/gfx3/gfx3_manager';
import { gfx2Manager } from '../../lib/gfx2/gfx2_manager';
import { gfx3MeshRenderer } from '../../lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3Cylinder } from '../../lib/gfx3_mesh/gfx3_cylinder';
import { Gfx3Sphere } from '../../lib/gfx3_mesh/gfx3_sphere';

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
import { CCScreen } from './cc_screen';
import { screenManager } from '../../lib/screen/screen_manager';
import { ArrayCollection } from '../../lib/core/array_collection';

import { MainScreen } from './select_screen';


// ---------------------------------------------------------------------------------------
const CAMERA_SPEED = 0.1;
class BackBtn extends UIWidget {
  constructor() {
    super({
      className: 'UIAccount',
      template: `<button>back</button>`
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


class UIrackList extends UIMenuListView {
  constructor(nPages) {
    super({axis : MenuAxis.X});

    this.myWidgets = [];
    this.nItemPerPages = nPages;
    this.curPage = -1;

    this.nextPageIcon = new UISprite();
    this.prevPageIcon = new UISprite();
    this.pageCntText = new UIText();

    const self=this;

    this.nextPageIcon.node.addEventListener('click' , function(){ self.nextPage(); })
    this.prevPageIcon.node.addEventListener('click' , function(){ self.prevPage(); })

    uiManager.addWidget(this.pageCntText, 'position:absolute; top:360px; left:40%; right:0; height:40px; width:100px;z-index:1;');

    this.nextPageIcon.loadTexture("/samples/crazy-cars/ar.png").then(() => {
      uiManager.addWidget(this.nextPageIcon, 'position:absolute; top:390px; left:95%; right:0; height:220px; width:20px;background-size: contain;z-index:1;');
    });
        
    this.prevPageIcon.loadTexture("/samples/crazy-cars/al.png").then(() => {
      uiManager.addWidget(this.prevPageIcon, 'position:absolute; top:390px; left:2%; right:0; height:220px; width:20px;background-size: contain;z-index:1;');
    });
    this.node.style.padding='12px';
    this.selectedServer=0;
  }

  addItem(item, enabled = true, index = -1) {
    let widget = new UITrack();
    widget.setItem(item);

    const track=item;
    const serv=this.selectedServer;

    widget.node.querySelector('.start-1p').addEventListener('click', function(e){

        fetch(wallet.site + '/startGame?trackname=' + track.name + "&serverID=" + serv + '&np=1', { method: 'GET', redirect:'manual', credentials: 'include' }).then(async(data)=>{
            const res = await data.blob();
            screenManager.requestSetScreen(new CCScreen(), { });
        })
    });

    widget.node.querySelector('.start-2p').addEventListener('click', function(){

        fetch(wallet.site + '/startGame?trackname=' + track.name + "&serverID=" + serv + '&np=2', { method: 'GET',redirect:'manual', credentials: 'include' }).then(async(data)=>{
            const res = await data.blob();
            screenManager.requestSetScreen(new CCScreen(), { });
        })
    });

    this.myWidgets.push(widget);

    /*this.addWidget(widget, enabled, index);*/
  }

  setPageForItem(n)
  {
    const page = Math.floor(n/this.nItemPerPages);
    if(page != this.curPage)
      this.setPage(page);
  }

  nextPage(){
    this.setPage(this.curPage+1)
  }
  prevPage(){

    if(this.curPage<=0)
      return;

    this.setPage(this.curPage-1);
  }

  setPage(n) {

    this.clear();

    const npages = Math.floor(this.myWidgets.length/ this.nItemPerPages)
    this.curPage = (n < npages) ? n : npages;
    
    this.prevPageIcon.node.style.opacity = (this.curPage ==0)?0.5:1.0;
    this.nextPageIcon.node.style.opacity = (this.curPage >= npages )?0.5:1.0;
    this.pageCntText.setText((this.curPage+1)+ ' / ' + (npages+1));

    const firstItem = this.curPage * this.nItemPerPages ;
    const lastItem = Math.min(firstItem + this.nItemPerPages, this.myWidgets.length );

    for(let i = firstItem; i < lastItem; i++)
    {
      this.addWidget(this.myWidgets[i], true, i);
    }
  }

  myWidgets;
}

class UITrack extends UIWidget {

  constructor() {
    super({className:'track-item',
    template:`
        <h3 class="track-name"></h3>
        <table class="track-stats">
            <tbody>
                <tr class="rank-hdr"><th class="text-right">difficulty</th><th class="text-center">class</th><th class="text-center">time</th><th class="text-center">bonus</th></tr>
                <tr><th class="track-difficulty"></th><td class="track-class"></td><td class="track-time"></td><td class="track-bonus"></td></tr>
            </tbody>
        </table>
        <img class="track-thumb" src="#">
        <table class="track-stats">
            <tbody>
                <tr class="rank-hdr"><th class="text-right">rank</th><th class="text-center">name</th><th class="text-center">time</th><th class="text-center">bonus</th><th class="text-center">nitros</th><th class="text-center">dmg</th></tr>
                <tr><td class="text-right">#0</td><td class="track-rank-1-account"></td><td class="track-rank-1-time"></td><td class="track-rank-1-bonus"></td><td class="track-rank-1-nitros"></td><td class="track-rank-1-dmg"></td></tr>
                <tr><td class="text-right">#1</td><td class="track-rank-2-account"></td><td class="track-rank-2-time"></td><td class="track-rank-2-bonus"></td><td class="track-rank-2-nitros"></td><td class="track-rank-2-dmg"></td></tr>
                <tr><td class="text-right">#2</td><td class="track-rank-3-account"></td><td class="track-rank-3-time"></td><td class="track-rank-3-bonus"></td><td class="track-rank-3-nitros"></td><td class="track-rank-3-dmg"></td></tr>
            </tbody>
        </table>
        <div class="row">
            <div class="col text-center">
                <button class="start-1p" np="1">start 1P</button>
                <button class="start-2p" np="2">start 2P</button>
            </div>
        </div>
    `

    });
    this.track = null;
    
  }

  setItem(t)
  {
    this.track = t;
    this.setId('track-'+t.name);
  }

  
  update(ts) {
    
    if (this.track) {

        this.node.querySelector('.track-name').textContent = this.track.name;
        this.node.querySelector('.track-difficulty').textContent = this.track.difficulty;
        this.node.querySelector('.track-class').textContent = this.track.class;
        this.node.querySelector('.track-bonus').textContent = this.track.nBonus;
        this.node.querySelector('.track-thumb').src = wallet.site+'/assets/img/tracks/'+this.track.name+'.png';
    } else {
        this.node.querySelector('.track-name').textContent = '--';
        this.node.querySelector('.track-difficulty').textContent = '--';
        this.node.querySelector('.track-class').textContent = '--';
        this.node.querySelector('.track-bonus').textContent = '--';
        this.node.querySelector('.track-thumb').src = '#';
    }
  }
  track;
}




class TrackSelect extends Screen {
  constructor() {
    super();


    this.camera = new Gfx3Camera(0);
    this.skybox = new Gfx3Skybox();

    
    this.trackList = new UIrackList(2);


    this.cameraAngle = 0;

    this.camera.setPosition(0, 4.5, -8);
    this.camera.lookAt(0,0,0);


    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];

    this.camera_fov = 100;

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

    this.lightDir = UT.VEC3_CREATE(0, -1, 0.2);

    
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

    gfx3MeshRenderer.binds = 1;

    this.digitsTex=[];
    this.digits=[];
    
    this.backBtn = new BackBtn();

  }

  
  
  getObjMat (obj, parent = null, parentNorm = null)
  {
    //const angles = UT.QUAT_TO_EULER(UT.VEC4_CREATE(quat.x, quat.y, quat.z, quat.w), "YXZ");

    UT.VEC3_SET(obj.wpos, obj.pos.x, obj.pos.y, obj.pos.z);

    UT.MAT4_TRANSLATE_N(obj.wpos[0], obj.wpos[1], obj.wpos[2], obj.matrix);

    if(obj.quat&&obj.wquat)
    {
      UT.VEC4_SET(obj.wquat, obj.quat.x, obj.quat.y, obj.quat.z, obj.quat.w);

      obj.nmatrix = UT.MAT4_IDENTITY();
      UT.MAT4_MULTIPLY_BY_QUAT_N(obj.nmatrix, obj.wquat);
      UT.MAT4_MULTIPLY_N(obj.matrix, obj.nmatrix);
    }

    if(obj.wscale && obj.scale)
    {
      UT.VEC3_SET(obj.wscale, obj.scale.x, obj.scale.y, obj.scale.z);
      UT.MAT4_SCALE_N(obj.matrix, obj.wscale[0], obj.wscale[1], obj.wscale[2]);
      UT.MAT4_SCALE_N(obj.nmatrix, obj.wscale[0], obj.wscale[1], obj.wscale[2]);
    }

    if(parent != null)
    {
        UT.MAT4_MULTIPLY_NO(parent, obj.matrix, obj.matrix);
        UT.MAT4_MULTIPLY_NO(parentNorm, obj.nmatrix, obj.nmatrix);
    }
  }




  async loadPod() {

    this.podMesh = new Gfx3Cylinder(3, 2, 64,UT.VEC2_CREATE(1,1));
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


    car.wpos = UT.VEC3_CREATE(0,0,0);
    car.wangles = UT.VEC3_CREATE(0.0,0.0,0.0);
    car.wquat = UT.VEC4_CREATE(0,0,0,1.0);
    car.wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
    car.matrix = UT.MAT4_IDENTITY();

    this.getObjMat(car);
    
    car.updateWheels();

    for (let n = 0; n < 4; n++) {

      car.wheels[n].wpos = UT.VEC3_CREATE(0,0,0);
      car.wheels[n].wangles = UT.VEC3_CREATE(0.0,0.0,0.0);
      car.wheels[n].wquat = UT.VEC4_CREATE(0,0,0,1.0);
      car.wheels[n].wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
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

        car.wheels[i].wpos = UT.VEC3_CREATE(0,0,0);
        car.wheels[i].wangles = UT.VEC3_CREATE(0.0,0.0,0.0);
        car.wheels[i].wquat = UT.VEC4_CREATE(0,0,0,1.0);
        car.wheels[i].wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
        car.wheels[i].matrix = UT.MAT4_IDENTITY();

        this.getObjMat(car.wheels[i]);
    }
    
    for (const obj of car.ChassisMesh) {
      obj[1].material.envMapEq = this.skyTexture;
      obj[1].material.lightning = true;
    }
  }

  async updateTrackList()
  {
    const self=this;
    this.carImgs = [];
    //this.wallet.getAssets(['cars']).then(()=>{

    const res = await fetch(wallet.site+'/getTracks', { method: 'GET', credentials: 'include' });
    const tracks = await res.json();

    const a = new ArrayCollection();
    for(let t of tracks)
    {
       a.push(t);
        //this.carList.addItem(c, true, n++);
    }
    this.trackList.setCollection(a);
    this.trackList.setPage(0);




      /*
        let n=0;
        for(let c of this.wallet.assetLists['cars'])
        {
          this.carList.addItem(c, true, n++);
        }
      */
    
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

  handleCarFocused(data)
  {

    /*
    for(let e of document.querySelectorAll('[id^="car-"]')){ e.style.border = '1px solid #000';  }

    const widget = this.carList.widgets[data.index];

    widget.node.style.border = '10px solid #0F0';
    widget.node.querySelector('.nft-image').style.animationPlayState = 'running';
    */

  }
  
  handleCarSelected(data){

    /*
    const a  = data.id.split('-');
    const self = this;
   
    fetch(this.site + '/selectCar?carid='+a[1]+'&type='+a[2]+'&to=none', { method: 'GET', credentials: 'include' }).then(()=>{
      self.setCar(parseInt(a[1]), parseInt(a[2]));
    });
    */
    
  }
  async onEnter() {

    const self=this;

    this.AccountUI = new UIAccount();
    uiManager.addWidget(this.AccountUI, 'position:absolute; top:0; left:0; right:0; height:50px;');

    this.wallet = await initWallet(this.site);
    this.wallet.engine = this;
    this.wallet.world = this.world;

    this.wallet.onLogin = function(){self.onLogin()};
    window.wallet = this.wallet;

    if(!this.wallet.myAccount)
        await fetch(this.site + '/selectCar?carid=1&type=-1&to=none', { method: 'GET', credentials: 'include' });

    /*await fetch(this.site + '/startGame?trackname=' + this.trackName + "&serverID=" + this.selectedServer + '&np=1', { method: 'GET', credentials: 'include' });*/

    this.selectedCar = new UISprite();
    await this.selectedCar.loadTexture(this.site + "/assets/nfts/car2.png");
    uiManager.addWidget(this.selectedCar, 'position:absolute; top:15px; left: 85%; right:0; height:80px; width:80px;background-size: contain;');

    uiManager.addWidget(this.backBtn,  'position:absolute; left:70%; top:45px; height:50px;');

    this.backBtn.getNode().addEventListener('click', function(){
      //screenManager.requestSetScreen(new CCScreen(), { });
      screenManager.requestSetScreen(new MainScreen(), { });
      
    })

    const response = await fetch(this.site + '/myGame', { method: 'GET', credentials: 'include' });
    const data = await response.json();
    if (data.error) {
      return;
    }

    eventManager.subscribe(this.trackList, 'E_ITEM_FOCUSED', this, this.handleCarFocused);
    eventManager.subscribe(this.trackList, 'E_ITEM_SELECTED', this, this.handleCarSelected);
  
    uiManager.focus(this.trackList);

    uiManager.addWidget(this.trackList, 'position:absolute; top:380px; left:0; right:0; height:220px; width:100%;');

    await this.updateTrackList();
    
    this.skyTexture = await gfx3TextureManager.loadTexture(this.site + "/assets/skybox/lobby.jpg");
    this.skySphere = new Gfx3Sphere(300, 8, 8, UT.VEC2_CREATE(1,1));
    this.skySphere.material.texture = this.skyTexture;

    await this.loadPod();
    await this.setCar(data.carid, data.cartype);

    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);

    document.addEventListener('keydown', this.handleKeyDownCb);
    document.addEventListener('keyup', this.handleKeyUpCb);

  }

  onExit() {

    uiManager.removeWidget(this.backBtn);
    uiManager.removeWidget(this.trackList.nextPageIcon);
    uiManager.removeWidget(this.trackList.prevPageIcon);
    uiManager.removeWidget(this.trackList.pageCntText);
    
    this.trackList.delete();
    
    uiManager.removeWidget(this.trackList);
    

    uiManager.removeWidget(this.selectedCar);
    uiManager.removeWidget(this.AccountUI);


    

    document.removeEventListener('mousedown', this.handleMouseDownCb);
    document.removeEventListener('mouseup', this.handleMouseUpCb);
    document.removeEventListener('mousemove', this.handleMouseMoveCb);

    document.addEventListener('keydown', this.handleKeyDownCb);
    document.addEventListener('keyup', this.handleKeyUpCb);

  }



  update(ts) {
    const now = new Date().getTime();

   
    if (this.world.myCar) {

        const m = UT.MAT4_IDENTITY();
        const nm =  UT.MAT4_IDENTITY();
        UT.MAT4_MULTIPLY_BY_QUAT_N(nm, this.world.myCar.wquat);
        UT.MAT4_MULTIPLY_N(nm,UT.MAT4_ROTATE_Y(this.a));
        this.world.myCar.nmatrix = nm;

        UT.MAT4_TRANSLATE_N(this.world.myCar.wpos[0], this.world.myCar.wpos[1], this.world.myCar.wpos[2], m);
        UT.MAT4_MULTIPLY_N(m,this.world.myCar.nmatrix);

        this.world.myCar.matrix = m;
        
        this.world.myCar.updateWheels();

        for (let n = 0; n < 4; n++) {
            
            this.world.myCar.wheels[n].wpos = UT.VEC3_CREATE(0,0,0);
            this.world.myCar.wheels[n].wangles = UT.VEC3_CREATE(0.0,0.0,0.0);
            this.world.myCar.wheels[n].wquat = UT.VEC4_CREATE(0,0,0,1.0);
            this.world.myCar.wheels[n].wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
            this.world.myCar.wheels[n].matrix = UT.MAT4_IDENTITY();
            this.world.myCar.wheels[n].nmatrix = UT.MAT4_IDENTITY();
      
            this.getObjMat(this.world.myCar.wheels[n], this.world.myCar.matrix, this.world.myCar.nmatrix);
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
    this.skySphere.position[0] = this.camera.position[0];
    this.skySphere.position[1] = this.camera.position[1];
    this.skySphere.position[2] = this.camera.position[2];
  }



  draw() {

    gfx3MeshRenderer.enableDirLight(this.lightDir);

    gfx3MeshRenderer.dirLightColor= UT.VEC4_CREATE(0.2, 0,  0.2, 0.0);
    gfx3MeshRenderer.pointLight0Color= UT.VEC4_CREATE(0.0, 0.0, 0.02, 2.0);
    gfx3MeshRenderer.pointLight1Color= UT.VEC4_CREATE(0.02, 0.02, 0.00, 2.0);

    gfx3MeshRenderer.enablePointLight(UT.VEC4_CREATE(-1,1,0), 0);
    gfx3MeshRenderer.enablePointLight(UT.VEC4_CREATE(1,1,0), 1);

    if (this.world.myCar) {
      
        if (this.world.myCar.ChassisMesh) {
          for (const obj of this.world.myCar.ChassisMesh) {
            gfx3MeshRenderer.drawMesh(obj[1], this.world.myCar.matrix, this.world.myCar.nmatrix);
          }
          const ofs = UT.QUAT_MULTIPLY_BY_VEC3(this.world.myCar.wquat, UT.VEC3_CREATE(-this.world.myCar.chassisWidth /2, 0, this.world.myCar.chassisLength + 0.2 ));
          const p=UT.VEC3_CREATE(this.world.myCar.wpos[0] + ofs[0] , this.world.myCar.wpos[1] + 2, this.world.myCar.wpos[2]+ ofs[2]);
          
        }
  
        if (this.world.myCar.tireMesh) {
          for (let w of this.world.myCar.wheels) {
            for (const obj of this.world.myCar.tireMesh) {
              gfx3MeshRenderer.drawMesh(obj[1], w.matrix, w.nmatrix);
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

export { TrackSelect };
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
import { PlayScreen } from './play_screen';
import { screenManager } from '../../lib/screen/screen_manager';
import { ArrayCollection } from '../../lib/core/array_collection';

import { CCScreen } from './select_screen';

import { InPlace } from './inplace';
import {UIPaginedMenuListView } from './ui_pagined_listview'

// ---------------------------------------------------------------------------------------
const CAMERA_SPEED = 0.1;
class BackBtn extends UIWidget {
  constructor() {
    super({
      className: 'UIButton',
      template: `<button>back</button>`
    });
  }
}

class JoinBtn extends UIWidget {
  constructor() {
    super({
      className: 'UIButton',
      template: `<button>join</button>`
    });
  }

  enable(e)
  {
    this.node.querySelector('button').disabled = !e;
  }
}

class CreateBtn extends UIWidget {
  constructor() {
    super({
      className: 'UIButton',
      template: `<button disabled>create</button>`
    });
  }
  enable(e)
  {
    this.node.querySelector('button').disabled = !e;
  }

}

class BuyNitro extends UIWidget {
  constructor() {
    super({
      className: 'UIBuyNitros',
      template: `
        <span>nitros : </span>
        <span><img src="`+wallet.site+`/assets/img/nitro-icon.png" alt="nitro" class="nitro-icon"><span id="nitros"></span></span>
        <span>
          <button data-dir="0" class="nitros-buy">-</button><input id="nitros-buy-n" value="0"><button data-dir="1" class="nitros-buy">+</button>
          <span id="nitros-buy-price">0.0000</span><img class="steel-token-icon" src="`+wallet.site+`/assets/img/steel-icon.ico">
          <button class="buy-nitros">buy</button>
          <button class="erase-nitros">X</button>
        </span>
      `
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
  
    }
}



class UITrack extends UIWidget {

  constructor() {
    super({className:'track-item',
    template:`
        <div>
          <button class="start-1p" np="1">start 1P</button>
          <button class="start-2p" np="2">start 2P</button>
        </div>
        <table>
        <tr>
        <td style="text-align:center"><h3 class="track-name"></h3><img class="track-thumb" src="#"></td>
        <td style="vertical-align:top">
        <h3 class="track-name"></h3>
          <table class="track-stats">
              <tbody>
                  <tr class="rank-hdr"><th>difficulty</th><th>class</th><th>time</th><th>bonus</th></tr>
                  <tr><th class="track-difficulty"></th><td class="track-class"></td><td class="track-time"></td><td class="track-bonus"></td></tr>
              </tbody>
          </table>
          <hr/>
          <table class="track-ranks">
              <thead><tr class="rank-hdr"><th >rank</th><th >name</th><th >time</th><th >bonus</th><th >nitros</th><th >dmg</th></tr></thead>
              <tbody>
                  <tr><td >#0</td><td class="track-rank-1-account"></td><td class="track-rank-1-time"></td><td class="track-rank-1-bonus"></td><td class="track-rank-1-nitros"></td><td class="track-rank-1-dmg"></td></tr>
                  <tr><td >#1</td><td class="track-rank-2-account"></td><td class="track-rank-2-time"></td><td class="track-rank-2-bonus"></td><td class="track-rank-2-nitros"></td><td class="track-rank-2-dmg"></td></tr>
                  <tr><td >#2</td><td class="track-rank-3-account"></td><td class="track-rank-3-time"></td><td class="track-rank-3-bonus"></td><td class="track-rank-3-nitros"></td><td class="track-rank-3-dmg"></td></tr>
              </tbody>
          </table>
        </td>
        
        </tr>
        </table>
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

    const diffs=['easy','medium','hard'];
    const classes = ['C','B','A'];
    
    if (this.track) {

        this.node.querySelector('.track-name').textContent = this.track.name;
        this.node.querySelector('.track-difficulty').textContent = diffs[this.track.difficulty];
        this.node.querySelector('.track-class').textContent = classes[this.track.class];
        this.node.querySelector('.track-bonus').textContent = this.track.nBonus;
        this.node.querySelector('.track-time').textContent = this.track.lapTime+'s';
        this.node.querySelector('.track-thumb').src = wallet.site+'/assets/img/tracks/'+this.track.name+'.png';

        const table = this.node.querySelector('.track-ranks');
        const tbody =table.createTBody();

        for (let i = 0; i < 3; i++) {

          const row=document.createElement('tr');
          var col = document.createElement('td');
          col.innerHTML='#' + i;
          row.appendChild(col);

          if ((this.track.times) && (i < this.track.times.length))
          {
              col = document.createElement('td');
              col.innerHTML = this.track.times[i].account;
              row.appendChild(col);

              col = document.createElement('td');
              col.innerHTML = this.track.times[i].time;
              row.appendChild(col);

              col = document.createElement('td');
              col.innerHTML = this.track.times[i].bonus;
              row.appendChild(col);

              col = document.createElement('td');
              col.innerHTML = this.track.times[i].nitros;
              row.appendChild(col);

              col = document.createElement('td');
              col.innerHTML = this.track.times[i].dmg;
              row.appendChild(col);
              
          }else{

              for(let j=0;j<5;j++)
              {
                  col = document.createElement('td');
                  col.className = 'text-center';
                  col.innerHTML = '-';
                  row.appendChild(col);
              }
         }
         tbody.appendChild(row);
         table.replaceChild(tbody, table.tBodies[0])  
      }
    } else {
        this.node.querySelector('.track-name').textContent = '--';
        this.node.querySelector('.track-difficulty').textContent = '--';
        this.node.querySelector('.track-class').textContent = '--';
        this.node.querySelector('.track-bonus').textContent = '--';
        this.node.querySelector('.track-time').textContent = '--';
        this.node.querySelector('.track-thumb').src = '#';
    }
  }
  track;
}

class UIGame extends UIWidget {

  constructor() {
    super({className:'track-item',
    template:`
        <div>
          <button class="join-game">join</button>
        </div>
        <h3 class="track-name"></h3><img class="track-thumb" src="#">
        <h3 class="track-name"></h3>
        <table class="track-stats">
          <tbody>
            <tr class="rank-hdr"><th>difficulty</th><th>class</th><th>time</th><th>bonus</th></tr>
            <tr><th class="track-difficulty"></th><td class="track-class"></td><td class="track-time"></td><td class="track-bonus"></td></tr>
          </tbody>
        </table>
      `

    });
    this.game = null;
    
  }

  setItem(g, t)
  {
    this.game = g;
    this.track = t;
    this.setId('game-'+g.id);
  }

  
  update(ts) {

    const diffs=['easy','medium','hard'];
    const classes = ['C','B','A'];
    
    if (this.game) {

        const track= this.track;

        this.node.querySelector('.track-name').textContent = track.name;
        this.node.querySelector('.track-difficulty').textContent = diffs[track.difficulty];
        this.node.querySelector('.track-class').textContent = classes[track.class];
        this.node.querySelector('.track-bonus').textContent = track.nBonus;
        this.node.querySelector('.track-time').textContent = track.lapTime+'s';
        this.node.querySelector('.track-thumb').src = wallet.site+'/assets/img/tracks/'+track.name+'.png';

  
    } else {
        this.node.querySelector('.track-name').textContent = '--';
        this.node.querySelector('.track-difficulty').textContent = '--';
        this.node.querySelector('.track-class').textContent = '--';
        this.node.querySelector('.track-bonus').textContent = '--';
        this.node.querySelector('.track-time').textContent = '--';
        this.node.querySelector('.track-thumb').src = '#';
    }
  }
  game;
}



class UIrackList extends UIPaginedMenuListView {
  constructor(nPages) {
    super(nPages);
    this.selectedServer=0;
  }


  addItem(item, enabled = true, index = -1) {
    let widget = new UITrack();
    widget.setItem(item);

    const track=item;
    const serv=this.selectedServer;

    widget.node.querySelector('.start-1p').addEventListener('click', function(e){

        fetch(wallet.site + '/startGame?trackname=' + track.name + "&serverID=" + serv + '&np=1', { method: 'GET', redirect:'manual', credentials: 'include' , cache: "no-store"}).then(async(data)=>{
            const res = await data.blob();
            screenManager.requestSetScreen(new PlayScreen(), { });
        })
    });


    if(this.twoP)
    {
      widget.node.querySelector('.start-2p').disabled = false;
      widget.node.querySelector('.start-2p').addEventListener('click', function(){
          fetch(wallet.site + '/startGame?trackname=' + track.name + "&serverID=" + serv + '&np=2', { method: 'GET',redirect:'manual', credentials: 'include', cache: "no-store" }).then(async(data)=>{
            const res = await data.blob();
            screenManager.requestSetScreen(new PlayScreen(), { });
          })
      });
    }else{
      widget.node.querySelector('.start-2p').disabled = true;
    }
    this.myWidgets.push(widget);
    /*this.addWidget(widget, enabled, index);*/
  }

  
  findTrack(name)
  {
      for(let t of this.myWidgets)
      {
        if(t.track.name === name)
          return t.track;
      }

      return null;
  }

  settwoP(twoP)
  {
    this.twoP = twoP;
    this.setPage(this.curPage);
  }

  selectedServer
}


class UIGameList extends UIPaginedMenuListView {
  constructor(nPages) {
    super(nPages);
    
  }

  addItem(item, enabled = true, index = -1) {
    let widget = new UIGame();
    widget.setItem(item.g, item.t);

    const game=item.g;

    widget.node.querySelector('.join-game').addEventListener('click', function(e){

        fetch(wallet.site + '/joinGame?gameID='+game.id, { method: 'GET', redirect:'manual', credentials: 'include' , cache: "no-store"}).then(async(data)=>{
            const res = await data.blob();
            screenManager.requestSetScreen(new PlayScreen(), { });
        })
    });

    this.myWidgets.push(widget);
  }

}

class TrackSelect extends Screen {
  constructor() {
    super();


    this.camera = new Gfx3Camera(0);
    this.skybox = new Gfx3Skybox();
    
    this.trackList = new UIrackList(1);
    this.gameList = new UIGameList(1);
    
    //this.gameList.show(false);


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

    

    this.digitsTex=[];
    this.digits=[];
    
    this.backBtn = new BackBtn();
    this.joinBtn = new JoinBtn();
    this.createBtn = new CreateBtn();
    this.AccountUI = new UIAccount();
    
  
  }

    
    
  
  getObjMat (obj, parent = null, parentNorm = null)
  {
    //const angles = UT.QUAT_TO_EULER(UT.VEC4_CREATE(quat.x, quat.y, quat.z, quat.w), "YXZ");

    UT.MAT4_TRANSLATE(obj.pos.x, obj.pos.y, obj.pos.z, obj.matrix);

    obj.nmatrix = UT.MAT4_IDENTITY();
    InPlace.MAT4_MULTIPLY_BY_QUAT(obj.nmatrix, obj.quat.x, obj.quat.y, obj.quat.z, obj.quat.w);
    UT.MAT4_MULTIPLY(obj.matrix, obj.nmatrix, obj.matrix);

    if(obj.scale)
    {
      InPlace.MAT4_SCALE(obj.matrix, obj.scale.x, obj.scale.y, obj.scale.z);
      InPlace.MAT4_SCALE(obj.nmatrix,  obj.scale.x, obj.scale.y, obj.scale.z);
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

  async updateTrackList()
  {

    if(this.world.myCar.carDef.id == 1)
      this.trackList.settwoP(false);
    else
      this.trackList.settwoP(true);

    const res = await fetch(wallet.site+'/getTracks', { method: 'GET', credentials: 'include' , cache: "no-store"});
    const tracks = await res.json();

    const a = new ArrayCollection();
    for(let t of tracks)
    {
       a.push(t);
        //this.trackList.addItem(c, true, n++);
    }
    this.trackList.setCollection(a);
    this.trackList.setPage(0);
    
  }
  
  async updateGames(){

    this.gameList.myWidgets=[];
    this.gameList.clear();

    const res = await fetch(this.wallet.site+'/getOpenGames?serverID='+this.selectedServer, { method: 'GET', credentials: 'include' , cache: "no-store"});
    const games = await res.json();
    
    const a = new ArrayCollection();
    for(const g of games)
    {
      const t = this.trackList.findTrack(g.trackname);
      a.push({g:g, t:t})
      //this.gameList.addItem({g:g, t:t}, true, n++);
    }

    this.gameList.setCollection(a);
    this.gameList.setPage(0);
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

    if(this.world.myCar.carDef.id == 1)
      this.trackList.settwoP(false);
    else
      this.trackList.settwoP(true);
  }

  
  disableNitroUI()
  {
    this.buyNitros.getNode().querySelectorAll('button').forEach(function(e){ e.disabled = true});
  }
  
  async enableNitroUI()
  {
    const buyNitroNode = this.buyNitros.getNode();
    await wallet.getNitros();

    buyNitroNode.querySelector('#nitros-buy-n').addEventListener('change' , function(){
      buyNitroNode.querySelector('#nitros-buy-price').innerHTML = parseInt(this.value * wallet.cfg.nitro_price);
    });
  
    buyNitroNode.querySelectorAll('.nitros-buy').forEach(function(e){
        
      e.addEventListener('click' , function ()  { 
  
        let numNitros = parseInt(buyNitroNode.querySelector('#nitros-buy-n').value); 
        const d = parseInt(this.getAttribute('data-dir')); 
        
        if (d > 0) 
          numNitros++; 
        else if (numNitros > 0) 
          numNitros--; 
  
          buyNitroNode.querySelector('#nitros-buy-n').value = numNitros; 
          buyNitroNode.querySelector('#nitros-buy-price').innerHTML = parseFloat(wallet.cfg.nitro_price * numNitros).toFixed(4); 
      });
    });
  
    buyNitroNode.querySelector('.buy-nitros').addEventListener('click',function(){
      const nNitros = parseInt(buyNitroNode.querySelector('#nitros-buy-n').value); 
      wallet.buyNitro(nNitros);
    });
      
    buyNitroNode.querySelector('.erase-nitros').addEventListener('click',function(){
      wallet.eraseNitro();
    });
  }

  
  async onLogin()
  {
    await wallet.getNitros();
    this.enableNitroUI();
    this.buyNitros.getNode().querySelectorAll('button').forEach(function(e){ e.disabled = false});
    this.updateTrackList();

  }

  async onLogout()
  {
    this.disableNitroUI();
    await wallet.getNitros();
    await wallet.getBalance();
    this.buyNitros.getNode().querySelectorAll('button').forEach(function(e){ e.disabled = true});
    this.updateTrackList();
  }
  
  async onEnter() {

    const self=this;

    uiManager.addWidget(this.backBtn,  'position:absolute; left:70%; top:45px; height:50px;');
    uiManager.addWidget(this.AccountUI, 'position:absolute; top:0; left:0; right:0; height:50px;');

    this.wallet = await initWallet(this.site);
    this.wallet.engine = this;
    this.wallet.world = this.world;

    window.wallet = this.wallet;

    this.wallet.onLogin = function(){self.onLogin()};
    this.wallet.onLogout = function(){self.onLogout()};

    this.buyNitros = new BuyNitro();
    uiManager.addWidget(this.buyNitros,  'position:absolute; left:0; top:100px; height:50px;');

    this.backBtn.getNode().addEventListener('click', function(){ screenManager.requestSetScreen(new CCScreen(), { }); });

    if(this.wallet.myAccount) {
      this.enableNitroUI();
    }else{
      await fetch(this.site + '/selectCar?carid=1&type=-1&to=none', { method: 'GET', credentials: 'include' , cache: "no-store"});
      this.disableNitroUI();
    }


    this.selectedCar = new UISprite();
    await this.selectedCar.loadTexture(this.site + "/assets/nfts/car2.png");
    uiManager.addWidget(this.selectedCar, 'position:absolute; top:15px; left: 85%; right:0; height:80px; width:80px;background-size: contain;');
    uiManager.addWidget(this.createBtn,  'position:absolute; left:0; top:310px; height:50px;');
    uiManager.addWidget(this.joinBtn,  'position:absolute; left:100px; top:310px; height:50px;');


    this.backBtn.getNode().addEventListener('click', function(){
      //screenManager.requestSetScreen(new PlayScreen(), { });
      screenManager.requestSetScreen(new CCScreen(), { });
      
    })

    const response = await fetch(this.site + '/myCar', { method: 'GET', credentials: 'include', cache: "no-store" });
    const data = await response.json();
    if (data.error) {
      return;
    }

    this.gameList.show(false);
    uiManager.addWidget(this.trackList, 'position:absolute; top:380px; left:0; right:0; height:220px; width:100%;');  
    
    uiManager.focus(this.trackList);

    this.createBtn.getNode().addEventListener('click', function()
    { 
      if(self.gameList.ctrlVisible)
      {
        uiManager.unfocus(self.gameList);
        self.gameList.show(false);
        uiManager.removeWidget(self.gameList);
  
      }

      uiManager.addWidget(self.trackList, 'position:absolute; top:380px; left:0; right:0; height:220px; width:100%;');  
      self.trackList.show(true);
      self.trackList.setPage(self.trackList.curPage);
      uiManager.focus(self.trackList);

      self.createBtn.enable(false);
      self.joinBtn.enable(true);
    });

    this.joinBtn.getNode().addEventListener('click', async function()
    { 
      if(self.trackList.ctrlVisible)
      {
        uiManager.unfocus(self.trackList);
        self.trackList.show(false);
        self.trackList.clear();
      }

      await self.updateGames();
      uiManager.removeWidget(self.trackList);
      uiManager.addWidget(self.gameList, 'position:absolute; top:380px; left:0; right:0; height:220px; width:100%;');
      self.gameList.show(true);
      uiManager.focus(self.gameList);

      self.createBtn.enable(true);
      self.joinBtn.enable(false);
    });

    this.skyTexture = await gfx3TextureManager.loadTexture(this.site + "/assets/skybox/lobby.jpg");
    this.skySphere = new Gfx3MeshShapeSphere(300, 8, 8, UT.VEC2_CREATE(1,1));
    this.skySphere.material.texture = this.skyTexture;

    //gfx3MeshRenderer.setShadowSourceProj(600, 200);

    await this.loadPod();
    await this.setCar(data.result.id, data.result.type);

    await this.updateTrackList();
    await this.updateGames();

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

    uiManager.removeWidget(this.createBtn);
    uiManager.removeWidget(this.joinBtn);

    uiManager.removeWidget(this.backBtn);
    uiManager.removeWidget(this.buyNitros);
    
    
    if(this.trackList.ctrlVisible)
    {
      this.trackList.show(false);
      uiManager.removeWidget(this.trackList);
    }
    this.trackList.delete();
      
    if(this.gameList.ctrlVisible)
    {
      this.gameList.show(false);
      uiManager.removeWidget(this.gameList);
    }
    this.gameList.delete();

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

        const m = UT.MAT4_IDENTITY();
        const nm =  UT.MAT4_IDENTITY();
        InPlace.MAT4_MULTIPLY_BY_QUAT(nm, this.world.myCar.quat.x, this.world.myCar.quat.y, this.world.myCar.quat.z, this.world.myCar.quat.w);
        UT.MAT4_MULTIPLY(nm,UT.MAT4_ROTATE_Y(this.a), nm);
        this.world.myCar.nmatrix = nm;

        UT.MAT4_TRANSLATE(this.world.myCar.pos.x, this.world.myCar.pos.y, this.world.myCar.pos.z, m);
        UT.MAT4_MULTIPLY(m,this.world.myCar.nmatrix, m);

        this.world.myCar.matrix = m;
        
        this.world.myCar.updateWheels();

        for (let n = 0; n < 4; n++) {
            
            this.world.myCar.wheels[n].matrix = UT.MAT4_IDENTITY();
            this.world.myCar.wheels[n].nmatrix = UT.MAT4_IDENTITY();
      
            this.getObjMat(this.world.myCar.wheels[n], this.world.myCar.matrix, this.world.myCar.nmatrix);

            if(this.world.myCar.wheels[n].pos.x>0)
              UT.MAT4_MULTIPLY(this.world.myCar.wheels[n].matrix, UT.MAT4_ROTATE_Y(Math.PI), this.world.myCar.wheels[n].matrix);   
  

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

    if(this.skySphere){
      this.skySphere.position[0] = this.camera.position[0];
      this.skySphere.position[1] = this.camera.position[1];
      this.skySphere.position[2] = this.camera.position[2];
  
    }
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
            gfx3MeshRenderer.drawMesh(obj[1], this.world.myCar.matrix);
          }
          const ofs = InPlace.QUAT_MULTIPLY_BY_VEC3(  UT.VEC4_CREATE(this.world.myCar.quat.x,this.world.myCar.quat.y,this.world.myCar.quat.z,this.world.myCar.quat.w), 
                                                    UT.VEC3_CREATE(-this.world.myCar.chassisWidth /2, 0, this.world.myCar.chassisLength + 0.2 ));
                                                    
          const p=UT.VEC3_CREATE(this.world.myCar.pos.x + ofs[0] , this.world.myCar.pos.y + 2, this.world.myCar.pos.y+ ofs[2]);
          
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
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
import { Gfx3MeshShapeCylinder } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_cylinder';
import { Gfx3MeshShapeSphere } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_sphere';

import { CircuitRace, initWallet } from './cc.js';
import { Gfx3Material } from '../../lib/gfx3_mesh/gfx3_mesh_material';
import { Gfx3Mesh } from '../../lib/gfx3_mesh/gfx3_mesh';
import { UISprite } from '../../lib/ui_sprite/ui_sprite';
import { UIText } from '../../lib/ui_text/ui_text';
import { Gfx2SpriteJAS } from '../../lib/gfx2_sprite/gfx2_sprite_jas'
import { TrackSelect } from './games_screen';
import { uiManager } from '../../lib/ui/ui_manager';
import { UIWidget } from '../../lib/ui/ui_widget';
import { screenManager } from '../../lib/screen/screen_manager';
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


class CCScreen extends Screen {
  constructor() {
    super();


    this.camera = new Gfx3Camera(0);
    this.skybox = new Gfx3Skybox();

    this.camera.setPosition(0,10,0);

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

    this.lightDir = UT.VEC3_CREATE(0, -1, 0.2);

    this.selectedServer = 0;
    this.trackName = 'circuit 003';

    this.camMode = 1;
    this.lastCamAngle = null;
    
    this.gameStat = 0;
    this.gameMessage = '';
    this.webSocket = null;
    this.intro = 0;
    this.mode = 0;

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

    gfx2Manager.cameraPosition;

    this.centerText = new UIText('margin:auto');
    
    this.steelIcon = new UISprite();
    this.userBonus = new UIText();
    this.BonusMultiplier = new UIText();

    this.nitroIcon = new UISprite();
    this.nitroTxt = new UIText();
    this.raceTime = new UIText();
    this.raceLaps = new UIText();

    this.backBtn = new BackBtn();



  }

  drawText(text)
  {
      if(this.digits.length<3)
          return;

      const nc = text.length;
      const nnc = 3 - nc;


      for(let n=0;n<nnc;n++)
      {
         this.digits[n].setTexture(this.digitsTex[0]);
      }

      for(let n=nnc;n<3;n++)
      {
          const nm = parseInt(text[n-nnc]);
          this.digits[n].setTexture(this.digitsTex[nm]);
      }
  }
  async loadDigitFont()
  {
      this.digitsTex=[];

      for(let n=0; n< 10;n++)
      {
          this.digitsTex[n] = await gfx2TextureManager.loadTexture(this.site + "/assets/fonts/"+n+".png");
      }
      
      for(let n=0;n<3;n++)
      {
        this.digits[n] = new Gfx2SpriteJAS();
        this.digits[n].setTexture(this.digitsTex[0]);
        this.digits[n].position[0] = -300 + n*40;//-90;
        this.digits[n].position[1] = 200;// -45;
        this.digits[n].position[2] = 0;
        this.digits[n].animations[0] = { name: '', frames: [{x: 0,y: 0,width: 100,height: 100}], frameDuration: 100000 };
        this.digits[n].currentAnimation=this.digits[0].animations[0];
        this.digits[n].width = 100;
        this.digits[n].height = 100;
      
      }
      

  }


  async loadStartLine(track, startname) {

    this.startLine = new Gfx3MeshObj();
    await this.startLine.loadFromFile(this.site + "/assets/mesh/" + startname + ".obj", this.site + "/assets/mesh/" + startname + ".mtl");

    const angles = UT.QUAT_TO_EULER(UT.VEC4_CREATE(track.trackPoints[track.startPts].rot.x, track.trackPoints[track.startPts].rot.y, track.trackPoints[track.startPts].rot.z, track.trackPoints[track.startPts].rot.w), "YXZ");
    angles[1] = -angles[1];


    for (let obj of this.startLine) {
      obj[1].setPosition(track.trackPoints[0].pos.x, track.trackPoints[0].pos.y, track.trackPoints[0].pos.z);
      obj[1].setRotation(angles[0], angles[1], angles[2]);
    }

  }

  async loadTerrain(track) {

    track.terrain.mesh = new Gfx3MeshObj();

    await track.terrain.mesh.loadFromFile(this.site + "/assets/mesh/" + track.terrain.name + ".obj", this.site + "/assets/mesh/" + track.terrain.name + ".mtl")


    for (const obj of track.terrain.mesh) {

      const name = obj[0];

      obj[1].setPosition(track.terrain.offset.x, track.terrain.offset.y, track.terrain.offset.z);

      if (name.startsWith('arch'))
      {
        /*
          child.material.transmission = 1.0;
          child.material.thickness = 0.2;
          child.material.roughness = 0.0;
          child.material.reflectivity= 0.2;
        */
      }

      if (name.startsWith('tube'))
      {
        obj[1].material.envMapEq = track.skyTexture;
        obj[1].material.envMapIntensity = 2;
      }

      if ((name.startsWith('bull'))&&(name.indexOf('Glass'))>=0)
      {
        obj[1].material.ambiant = UT.VEC4_CREATE(0,0,0,1);
        obj[1].material.envMapEq = track.skyTexture;
        obj[1].material.envMapIntensity = 2;
      }
      

      if ((name.startsWith('Wheel')) || (name.startsWith('Crystal')) || (name.startsWith('buddha')) || (name.startsWith('fire-start'))) {

        
        obj[1].centerVtx();
      }

      if (name == 'Plane') {
        this.ground = obj[1];
      }
    }

  }

  async createRoadMat(track) {

    
    const roadTex = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/" + track.roadTex)

    this.roadMaT = new Gfx3Material({ texture: roadTex, lightning:true, envMapIntensity : 4, envMapEq : track.skyTexture, specular: UT.VEC4_CREATE(0.1, 0.01, 0.01, 32), ambiant: UT.VEC4_CREATE(0.01, 0.01, 0.01, 1) });

    if (track.roadNorm) {
      this.roadMaT.normalMap = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/" + track.roadNorm)
      this.roadMaT.normalIntensity = 0.4;
    }


    if (track.roadRought) {
      this.roadMaT.roughnessMap = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/" + track.roadRought)
    }

    if (track.roadEmm) {
      this.roadMaT.emissiveMap = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/" + track.roadEmm)
      this.roadMaT.emissive = UT.VEC3_CREATE(0.4,0.4,0.4);
      this.roadMaT.emissiveIntensity = 1.0;
    }

    const arrowTex = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/arrows.png");
    const arrowsNormals = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/arrows_n.png");

    this.arrowMat = new Gfx3Material({ texture: arrowTex, normalMap: arrowsNormals, normalIntensity: 1.0 });

  }

  createTrackGeometry(track) {
    this.roadObj = new Gfx3Mesh();
    this.roadObj.setMaterial(this.roadMaT);
    this.roadObj.build(track.positions, track.texcoords, track.indices, UT.VEC2_CREATE(track.roadTexScale.x * 0.4, track.roadTexScale.y ));

    this.roadWall = new Gfx3Mesh();
    this.roadWall.setMaterial(this.arrowMat);
    this.roadWall.build(track.positions, track.texcoords, track.indices2, UT.VEC2_CREATE(1, 20));
  }

  async makeTrack(track) {

    if (!track.roadTexScale)
      track.roadTexScale = { x: 2, y: 4 };

    await this.createRoadMat(track);
    this.createTrackGeometry(track);
  }


  async createTrack() {
    await this.loadStartLine(this.world.track, 'start');
    await this.loadTerrain(this.world.track);
    await this.makeTrack(this.world.track);
  }


  async loadCar(car) {

    car.ChassisMesh = new Gfx3MeshObj();
    await car.ChassisMesh.loadFromFile(this.site + "/assets/mesh/" + car.carDef.chassis + ".obj", this.site + "/assets/mesh/" + car.carDef.chassis + ".mtl")


    if (car.carDef.suspension) {

      car.tireMesh = new Gfx3MeshObj();
      await car.tireMesh.loadFromFile(this.site + "/assets/mesh/" + car.carDef.suspension.tire + ".obj", this.site + "/assets/mesh/" + car.carDef.suspension.tire + ".mtl")
    }

    const bbox = car.ChassisMesh.getBoundingBox();

    car.chassisWidth = bbox.max[0] - bbox.min[0];
    car.chassisHeight = bbox.max[1] - bbox.min[1];
    car.chassisLength = bbox.max[2] - bbox.min[2];

    car.center = UT.VEC3_CREATE(bbox.min[0] + car.chassisWidth / 2, bbox.min[1] + car.chassisHeight / 2, bbox.min[2] + car.chassisLength / 2);

    car.updateWheels();

    car.wpos = UT.VEC3_CREATE(0,0,0);
    car.wangles = UT.VEC3_CREATE(0.0,0.0,0.0);
    car.wquat = UT.VEC4_CREATE(0,0,0,1.0);
    car.wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
    car.matrix = UT.MAT4_IDENTITY();


    this.getObjMat(car);

    for (let n = 0; n < 4; n++) {

      car.wheels[n].wpos = UT.VEC3_CREATE(0,0,0);
      car.wheels[n].wangles = UT.VEC3_CREATE(0.0,0.0,0.0);
      car.wheels[n].wquat = UT.VEC4_CREATE(0,0,0,1.0);
      car.wheels[n].wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
      car.wheels[n].matrix = UT.MAT4_IDENTITY();

      this.getObjMat(car.wheels[n]);
    }

    car.massVehicle = car.carDef.massVehicle;

  }


  async addTrack(track) {

    const mats = [];

    for(let w of track.walls)
    {
      w.wpos = UT.VEC3_CREATE(w.pos.x, w.pos.y, w.pos.z);
      w.wquat = UT.VEC4_CREATE(w.quat.x, w.quat.y, w.quat.z, w.quat.w);
      w.wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
      w.wangles = UT.VEC3_CREATE(w.eul.x, w.eul.y , w.eul.z);
      w.matrix = UT.MAT4_IDENTITY();
      this.getObjMat(w);
      mats.push(w.matrix);
    }

    track.wallMesh = track.wallObject.dupe(mats);


    if ((track.woodDefs) && (track.woodDefs.length > 0)) {

      for (let n = 0; n < track.woodDefs.length; n++) {

        const wood = track.addWoods(track.woodDefs[n].ptIdx, track.woodDefs[n].num, track.woodDefs[n].width, track.woodDefs[n].radius, track.woodDefs[n].mass, track.woodDefs[n].offset);
        wood.mesh = new Gfx3MeshShapeCylinder(wood.radius, wood.width * 2, 24, UT.VEC2_CREATE(1, 1));
        wood.mesh.setMaterial(this.woodMaterial);

        for(let o of wood.objects)
        {
          o.wpos = UT.VEC3_CREATE(o.pos.x,o.pos.y,o.pos.z);
          o.wquat = UT.VEC4_CREATE(o.quat.x,o.quat.y,o.quat.z,o.quat.w);
          o.wscale = UT.VEC3_CREATE(1.0,1.0,1.0);
          
          o.wangles = UT.VEC3_CREATE(0.0,0.0,0.0);
          o.matrix = UT.MAT4_IDENTITY();
        }
      }
    }


    if ((track.springDefs) && (track.springDefs.length > 0)) {
      for (let n = 0; n < track.springDefs.length; n++) {
        track.addSpring(track.springDefs[n].ptIdx, track.springDefs[n].offset, track.springDefs[n].eqPts, track.springDefs[n].eqA, track.springDefs[n].mass, track.springDefs[n].size, track.springDefs[n].stiffness, track.springDefs[n].damping, track.springDefs[n].initPts, track.springDefs[n].initA, track.springDefs[n].limit, track.springDefs[n].limitA, track.springDefs[n].shape);
      }
    }

    if ((track.ropeDefs) && (track.ropeDefs.length > 0)) {
      for (let n = 0; n < track.ropeDefs.length; n++) {
        track.addRope(track.ropeDefs[n].ptIdx, track.ropeDefs[n].offset, track.ropeDefs[n].eqPts, track.ropeDefs[n].eqA, track.ropeDefs[n].mass, track.ropeDefs[n].size, track.ropeDefs[n].softness, track.ropeDefs[n].damping, track.ropeDefs[n].motorforce, track.ropeDefs[n].bounce, track.ropeDefs[n].initPts, track.ropeDefs[n].initA, track.ropeDefs[n].limit, track.ropeDefs[n].limitA, track.ropeDefs[n].shape);
      }
    }


    if ((track.bonusDefs) && (track.bonusDefs.length > 0)) {
      for (let n = 0; n < track.bonusDefs.length; n++) {
        const bonus = track.addBonus(track.bonusDefs[n].ptIdx, track.bonusDefs[n].type, track.bonusDefs[n].time, track.bonusDefs[n].offset, track.bonusDefs[n].scale);
        bonus.wpos = UT.VEC4_CREATE(bonus.pos.x, bonus.pos.y, bonus.pos.z, 1.0);
        bonus.wangles = UT.VEC3_CREATE(bonus.angles.x, bonus.angles.y, bonus.angles.z);
        bonus.wscale = UT.VEC3_CREATE(bonus.scale.x, bonus.scale.y, bonus.scale.z);
        bonus.matrix = UT.MAT4_IDENTITY();
      }
    }

    for (let n = 0; n < track.loopings.length; n++) {
      for (let i = 0; i < track.loopings[n].bonuses.length; i++) {
        const bonus = track.addBonus(track.loopings[n].bonuses[i].ptIdx, track.loopings[n].bonuses[i].type, track.loopings[n].bonuses[i].time, track.loopings[n].bonuses[i].offset, track.loopings[n].bonuses[i].scale);
        bonus.wpos = UT.VEC4_CREATE(bonus.pos.x, bonus.pos.y, bonus.pos.z, 1.0);
        bonus.wangles = UT.VEC3_CREATE(bonus.angles.x, bonus.angles.y, bonus.angles.z);
        bonus.wscale = UT.VEC3_CREATE(bonus.scale[0], bonus.scale[1], bonus.scale[2]);
        bonus.matrix = UT.MAT4_IDENTITY();
      }
    }

    if ((track.jumpersDefs) && (track.jumpersDefs.length > 0)) {

      for (let n = 0; n < track.jumpersDefs.length; n++) {
        const jumper = track.addJumper(track.jumpersDefs[n].ptIdx, track.jumpersDefs[n].offset, track.jumpersDefs[n].angle, track.jumpersDefs[n].size);
        jumper.wangles = UT.VEC3_CREATE(jumper.angles.x, jumper.angles.y, jumper.angles.z);
        jumper.wpos = UT.VEC4_CREATE(jumper.pos.x, jumper.pos.y, jumper.pos.z, 1.0);
        jumper.wquat = UT.VEC4_CREATE(jumper.rot.x, jumper.rot.y, jumper.rot.z, jumper.rot.w);
        jumper.wscale = UT.VEC3_CREATE(jumper.size.x, jumper.size.y, jumper.size.z);
        jumper.matrix = UT.MAT4_IDENTITY();

        UT.MAT4_TRANSLATE_N(jumper.wpos[0], jumper.wpos[1], jumper.wpos[2], jumper.matrix);
        UT.MAT4_MULTIPLY_BY_QUAT_N(jumper.matrix, jumper.wquat);
        UT.MAT4_SCALE_N(jumper.matrix, jumper.wscale[0], jumper.wscale[1], jumper.wscale[2]);

        jumper.nmatrix=UT.MAT4_IDENTITY();
        UT.MAT4_MULTIPLY_BY_QUAT_N(jumper.nmatrix, jumper.wquat);
  
      }
    }

    if ((track.turretsDefs) && (track.turretsDefs.length > 0)) {

      for (let n = 0; n < track.turretsDefs.length; n++) {
        const turret = track.addTurret(track.turretsDefs[n].ptIdx, track.turretsDefs[n].model, track.turretsDefs[n].shotModel, track.turretsDefs[n].activation, track.turretsDefs[n].offset, track.turretsDefs[n].angle, track.turretsDefs[n].size, track.turretsDefs[n].projPts, track.turretsDefs[n].projSize, track.turretsDefs[n].projMass, track.turretsDefs[n].projSpeed, track.turretsDefs[n].projAngle, track.turretsDefs[n].projAngle2, track.turretsDefs[n].projDelay, track.turretsDefs[n].projTTL);

        const name = turret.model ? turret.model : "turret";
        turret.main = new Gfx3MeshObj();
        await turret.main.loadFromFile(this.site+"/assets/mesh/" + name + ".obj", this.site+"/assets/mesh/" + name + ".mtl");

        if((turret.shotModel)&&(turret.shotModel.length>0))
        {
          turret.shotMesh=new Gfx3MeshObj();
          await turret.shotMesh.loadFromFile(this.site+"/assets/mesh/" + turret.shotModel + ".obj", this.site+"/assets/mesh/" + turret.shotModel + ".mtl");
        }else{
          turret.shotMesh=new Gfx3MeshShapeSphere(1,8,8, UT.VEC2_CREATE(1,1));
        }

        for(let s of turret.main)
        {
          s[1].position[0] = turret.pos.x;
          s[1].position[1] = turret.pos.y;
          s[1].position[2] = turret.pos.z;
    
          s[1].rotation[0] = turret.angles.x;
          s[1].rotation[1] = turret.angles.y;
          s[1].rotation[2] = turret.angles.z;        
    
          s[1].scale[0] = turret.size.x;
          s[1].scale[1] = turret.size.y;
          s[1].scale[2] = turret.size.z;     

          if(s[0].indexOf('body')>=0)
            turret.object=s[1];

          if(s[0].indexOf('head')>=0)
            turret.head=s[1];              

          if(s[0].indexOf('canon')>=0)
            turret.canon=s[1];              
        }
      }
    }
  }

  async loadGame(data)
  {
    await this.world.loadTrack(data.trackname, this.site);

    this.world.track.skyTexture = await gfx3TextureManager.loadTexture(this.site + "/assets/skybox/"+this.world.track.skyBoxImg);
    this.skySphere = new Gfx3MeshShapeSphere(300, 8, 8, UT.VEC2_CREATE(1,1));
    this.skySphere.material.texture = this.world.track.skyTexture;

    const texture = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/wood.jpg");
    const normals = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/wood_n.png");

    this.woodMaterial = new Gfx3Material({ diffuse: UT.VEC4_CREATE(1, 1, 1, 1), texture: texture, normals: normals, lightning: true });

    if (!this.world.track.bonusObject) {
      const name = "bonus";
      this.world.track.bonusObject = new Gfx3MeshObj();
      await this.world.track.bonusObject.loadFromFile(this.site + "/assets/mesh/" + name + ".obj", this.site + "/assets/mesh/" + name + ".mtl");
    }

    if (!this.world.track.jumperObject) {
      const name = "jumper";
      this.world.track.jumperObject = new Gfx3MeshObj();
      await this.world.track.jumperObject.loadFromFile(this.site + "/assets/mesh/" + name + ".obj", this.site + "/assets/mesh/" + name + ".mtl");
    }

    if (!this.world.track.wallObject) {

      this.world.track.wallObject = new Gfx3MeshObj();
      await this.world.track.wallObject.loadFromFile(this.site + "/assets/mesh/" + this.world.track.wallName + ".obj", this.site + "/assets/mesh/" + this.world.track.wallName + ".mtl");
    }

    this.world.track.startPts = 0;

    const carDef = await this.wallet.getCar(data.carid, data.cartype);
    this.world.myCar = await this.world.createCar(carDef);
    await this.loadCar(this.world.myCar);
    this.world.cars.push(this.world.myCar);

    await this.createTrack();
    await this.addTrack(this.world.track);

    for (const obj of this.world.myCar.ChassisMesh) {
      obj[1].material.envMapEq = this.world.track.skyTexture;
      obj[1].material.lightning = true;
    }

  }


  initGame(serverPath, sessh, amhost, gameid) {
    const self = this;

    try {
      this.webSocket = new WebSocket(serverPath, ["protocolOne", "protocolTwo"]);
      this.webSocket.binaryType = "arraybuffer";
    }
    catch (e) {
      alert('unable to connect server ' + serverPath + ' ' + e.message);
      return;
    }

    this.webSocket.onerror = function (event) {

      alert('socket error on server ' + serverPath + ' ' + event);

      self.gameStat = 2;
      self.gameMessage = 'server connection error';
      self.wallet.newAlert("server connection error");
      self.webSocket.close();
    }

    this.webSocket.onopen = function (event) {

      if (amhost)
        self.webSocket.send('{"msg" : "startgame", "data":{ "id" : "' + sessh + '"}}');
      else
        self.webSocket.send('{"msg" : "joingame", "data":{ "id" : "' + sessh + '", "gameid" : "' + gameid + '"}}');

      self.webSocket.onmessage = function (sockEv) {

        if (typeof sockEv.data === 'string') {

          let obj
          try {
            obj = JSON.parse(sockEv.data);
          }
          catch (e) {
            self.wallet.newAlert('unable to parse message data ' + e.message);
            return;
          }

          if (obj.msg == "gameover") {
            self.gameStat = 2;
            self.gameMessage = obj.data;
            self.webSocket.close();
          } else if (obj.msg == "finished") {
            self.gameStat = 3;
            self.gameMessage = obj.data;
            self.webSocket.close();

            self.centerText.setText(self.gameMessage);
            self.centerText.setVisible(true);

          } else if (obj.msg == "wait") {
            self.centerText.setText('waiting for player');
            self.centerText.setVisible(true);
          } else if (obj.msg == "error") {
            self.centerText.setText("error : " + obj.data);
            self.centerText.setVisible(true);

          } else if (obj.msg == "queued") {
            self.centerText.setText('server full, waiting for ' + obj.data + ' instance to finish');
            self.centerText.setVisible(true);

            self.wallet.newAlert('server full, waiting for ' + obj.data + ' instance to finish');
          } else if (obj.msg == "ready") {
            self.gameStat = 1;
          }
        } else {

          const now = new Date().getTime();

          try {
            const view = new DataView(sockEv.data);
            self.fa = new Float32Array(view.buffer);
          }
          catch (e) {
            self.wallet.newAlert('unable to parse message data ' + e.message);
            return;
          }

          self.world.initData(self.fa);
          self.world.bin2cars(self.fa, now);
        }
      }
    }
  }


  async onEnter() {

    this.wallet = await initWallet(this.site);
    this.wallet.engine = this;
    this.wallet.world = this.world;

    /*
    await fetch(this.site + '/selectCar?carid=1&type=-1&to=start', { method: 'GET', credentials: 'include' });
    await fetch(this.site + '/startGame?trackname=' + this.trackName + "&serverID=" + this.selectedServer + '&np=1', { method: 'GET', credentials: 'include' });
    */

    const response = await fetch(this.site + '/myGame', { method: 'GET', credentials: 'include' });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    await this.steelIcon.loadTexture(this.site + "/assets/img/steel-icon.png");
    await this.nitroIcon.loadTexture(this.site + "/assets/img/nitro-icon.png");

    uiManager.addWidget(this.backBtn, 'position:absolute; left:90%; top:90%; height:50px;');

    this.backBtn.getNode().addEventListener('click', function(){
      //screenManager.requestSetScreen(new CCScreen(), { });
      screenManager.requestSetScreen(new TrackSelect(), { });
      
    })


    this.loadDigitFont();
    
    uiManager.addWidget(this.steelIcon, 'position:absolute; top:0; left:0; right:0; height:50px;background-size: contain;');
    uiManager.addWidget(this.userBonus, 'position:absolute; top:0; left:80px; right:0; height:50px');
    uiManager.addWidget(this.BonusMultiplier, 'position:absolute; top:0; left:50%; right:0; height:50px');

    uiManager.addWidget(this.nitroIcon, 'position:absolute; top:50px; left:0; right:0; height:50px; width:64px;    background-size: contain;');
    uiManager.addWidget(this.nitroTxt, 'position:absolute; top:50px; left:80px; right:0; height:50px');

    uiManager.addWidget(this.raceTime, 'position:absolute; top:100px; left:0; right:0; height:50px;width:50%');
    uiManager.addWidget(this.raceLaps, 'position:absolute; top:100px; left:50%; right:0; height:50px');

    uiManager.addWidget(this.centerText, 'position:absolute; top:50%; left:25%; right:0; height:250px;width:50%; font-size:72px;display:flex-grid;');

    

    this.userBonus.setText('x0');
    this.BonusMultiplier.setText('x0');
    this.nitroTxt.setText('x0');
    this.raceTime.setText('0 sec');
    this.raceLaps.setText('0/3');
    this.centerText.setText('wait');

    this.wcamOfset = UT.VEC3_CREATE(0.0, 0.0, 0.0);
    this.wt = UT.VEC3_CREATE(0.0, 0.0, 0.0);
    this.wcamDest = UT.VEC3_CREATE(0, 0.0, 0.0);
    this.wfrontVec = UT.VEC3_CREATE(0, 0.0, 0.0);
    this.lastCamPos= UT.VEC3_CREATE(0, 0.0, 0.0);
    this.camDest= UT.VEC3_CREATE(0, 0.0, 0.0);

    this.camOfset = UT.VEC3_CREATE(0, 2.5, -2.5);
    this.frontOfset = UT.VEC3_CREATE(0, 0, 5);
    this.frontOfset2 = UT.VEC3_CREATE(0, 1.3, 1.2);
    this.forwardVec = UT.VEC3_CREATE(0, 0, 1.0);

    this.tmpMat = UT.MAT4_IDENTITY();
    await this.loadGame(data);

    this.initGame(data.serverPath, data.sessh, data.amhost, -1);

    this.centerText.setText('press');

    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);

    document.addEventListener('keydown', this.handleKeyDownCb);
    document.addEventListener('keyup', this.handleKeyUpCb);

  }

  onExit() {


    uiManager.removeWidget(this.centerText);
    uiManager.removeWidget(this.steelIcon);
    uiManager.removeWidget(this.userBonus);
    uiManager.removeWidget(this.BonusMultiplier);
    uiManager.removeWidget(this.nitroIcon);
    uiManager.removeWidget(this.nitroTxt);
    uiManager.removeWidget(this.raceTime);
    uiManager.removeWidget(this.raceLaps);
    uiManager.removeWidget(this.backBtn);
     
    
    document.removeEventListener('mousedown', this.handleMouseDownCb);
    document.removeEventListener('mouseup', this.handleMouseUpCb);
    document.removeEventListener('mousemove', this.handleMouseMoveCb);

    document.addEventListener('keydown', this.handleKeyDownCb);
    document.addEventListener('keyup', this.handleKeyUpCb);

  }


  
  getObjMat (obj)
  {
    //const angles = UT.QUAT_TO_EULER(UT.VEC4_CREATE(quat.x, quat.y, quat.z, quat.w), "YXZ");

    UT.VEC3_SET(obj.wpos, obj.pos.x, obj.pos.y, obj.pos.z);

    UT.MAT4_TRANSLATE_N(obj.wpos[0], obj.wpos[1], obj.wpos[2], obj.matrix);

    if(obj.quat&&obj.wquat)
    {
      UT.VEC4_SET(obj.wquat, obj.quat.x, obj.quat.y, obj.quat.z, obj.quat.w);
      UT.MAT4_MULTIPLY_BY_QUAT_N(obj.matrix, obj.wquat);
    }

    if(obj.wscale && obj.scale)
    {
      UT.VEC3_SET(obj.wscale, obj.scale.x, obj.scale.y, obj.scale.z);
      UT.MAT4_SCALE_N(obj.matrix, obj.wscale[0], obj.wscale[1], obj.wscale[2]);
    }
  }


  updateCamera(myCar, loop, tube, tmesh, t) {

    const dt = t / 1000.0;

    if (myCar.ChassisMesh === null)
      return;

      /*
    if ((loop !== null) && (p.distanceTo(loop.center) < loop.height)) {
      this.camDest = new THREE.Vector3(loop.center.x, loop.center.y, loop.center.z);
      this.targetFov = 55;

      if (loop.hide.length > 0) {
        const objects = loop.hide.split(',');

        for (let obj of objects) {
          tmesh.traverse((child) => {

            if (child.name === obj) {
              child.visible = false;
              this.hiddenObjects.push(child);
            }
          });
        }
      }

      this.camera.setPosition(camDest.x, camDest.y, camDest.z);
      this.camera.lookAt(p.x, p.y, p.z);
    }
    else if ((tube !== null) && (p.distanceTo(tube.center) < tube.width)) {
      this.camDest = new THREE.Vector3(tube.center.x, tube.center.y, tube.center.z);
      this.targetFov = 75;

      this.camera.setPosition(camDest.x, camDest.y, camDest.z);
      this.camera.lookAt(p.x, p.y, p.z);

    } else {
      */

      this.targetFov = 100;

      let obj = null;

      while ((obj = this.hiddenObjects.pop()) != null) {
        obj.visible = true;
      }

      UT.QUAT_MULTIPLY_BY_VEC3_N(myCar.wquat, this.camOfset, this.wcamOfset);
      UT.QUAT_MULTIPLY_BY_VEC3_N(myCar.wquat, this.frontOfset, this.wt);
      UT.VEC3_ADD_N(myCar.wpos, this.wcamOfset, this.camDest);


      switch (this.camMode) {
        case 1:
          this.camera.setPosition(this.camDest[0], this.camDest[1], this.camDest[2]);
          this.camera.lookAt(myCar.wpos[0], myCar.wpos[1], myCar.wpos[2]);
          this.lastCamAngle = null;
          break;
        case 2:

          UT.QUAT_MULTIPLY_BY_VEC3_N(myCar.wquat, this.forwardVec , this.wfrontVec);
          const carAngle = Math.atan2(this.wfrontVec[0], this.wfrontVec[2]) - Math.PI/2;
          let curAngle = carAngle;

          if (this.lastCamAngle !== null) {

            if ((carAngle - this.lastCamAngle) < - Math.PI)
              this.lastCamAngle -= Math.PI * 2;
            else if ((carAngle - this.lastCamAngle) > Math.PI)
              this.lastCamAngle += Math.PI * 2;

            curAngle = this.lastCamAngle + ((carAngle - this.lastCamAngle) * 2 * dt)
          }

          //console.log('carAngle:'+carAngle + ' curAngle: '+curAngle+' this.lastCamAngle:'+this.lastCamAngle +' dt:'+dt);

          const d = 7;

          //const camMove = camDiff.clone().multiplyScalar(dt * 3);

          this.camera.setPosition(myCar.wpos[0] - Math.cos(curAngle) * d, myCar.wpos[1] + 2.5, myCar.wpos[2] + Math.sin(curAngle) * d);
          this.camera.setRotation(0, -(curAngle-Math.PI/2), 0);

          this.lastCamAngle = curAngle;
          //this.camera.lookAt(p.x, p.y, p.z);
          break;
        case 3:
          this.camera.setPosition(this.camDest[0], myCar.wpos[1] + 8, this.camDest[2]);
          this.camera.lookAt(myCar.wpos[0] + this.wt[0], myCar.wpos[1] + this.wt[1], myCar.wpos[2] + this.wt[2]);
          this.lastCamAngle = null;
          break;
        case 4:
          //const frontOfset = new THREE.Vector3(0, 1.3, 1.2).applyQuaternion(q);
          //const frontOfset = new THREE.Vector3(0, 1.3, 1.2).applyMatrix4(m);
          UT.QUAT_MULTIPLY_BY_VEC3_N(myCar.wquat, this.frontOfset2, this.wfrontVec);
          //= q,
          this.camera.setPosition(myCar.wpos[0] + this.wfrontVec[0], myCar.wpos[1] + this.wfrontVec[1], myCar.wpos[2] + this.wfrontVec[2]);
          this.camera.lookAt(myCar.wpos[0] + this.wt[0], myCar.wpos[1] + this.wt[1], myCar.wpos[2] + this.wt[2]);
          this.lastCamAngle = null;
          break;
      }

    //}

    UT.VEC3_SET(this.lastCamPos , myCar.wpos[0], myCar.wpos[1], myCar.wpos[2]);

    const fovDiff = this.targetFov - this.camera_fov;
    const fovMov = fovDiff / 20;

    this.camera_fov += fovMov;

    gfx3Manager.views[0].setPerspectiveFovy(100 * Math.PI / 180.0);
    //gfx3Manager.views[0].setPerspectiveFovy(this.camera_fov);
  }

  
  updateCars(world, time) {

    if(world.lastCarData === null)
      return;

    const cars = world.lastCarData.cars;
    const woods = world.lastCarData.woods;
    const bonuses = world.lastCarData.bonuses;
    const turrets = world.lastCarData.turrets;
    const springs = world.lastCarData.springs;
    const ropes = world.lastCarData.ropes;

    const delta = time - world.lastBufferTime;

    for (let n = 0; n < cars.length; n++) {
        
        let mycar = null;

        for(let i=0;i<world.cars.length;i++)
        {
            if(world.cars[i].servId == cars[n].id)
            {
                mycar = world.cars[i];
                break;
            }
        }

        if(mycar === null)
          continue;

        if ((world.deltaTime !== null) && (delta < world.deltaTime)) {

          mycar.pos.x = cars[n].pos.x + world.dataDelta.cars[n].pos.x * delta / world.deltaTime;
          mycar.pos.y = cars[n].pos.y + world.dataDelta.cars[n].pos.y * delta / world.deltaTime;
          mycar.pos.z  =cars[n].pos.z + world.dataDelta.cars[n].pos.z * delta / world.deltaTime;

        } else {
          mycar.pos.x =cars[n].pos.x;
          mycar.pos.y =cars[n].pos.y;
          mycar.pos.z =cars[n].pos.z;
        }
        
        mycar.quat.x =cars[n].quat.x;
        mycar.quat.y =cars[n].quat.y;
        mycar.quat.z =cars[n].quat.z;
        mycar.quat.w =cars[n].quat.w;
        
        this.getObjMat(mycar);

        for (let i = 0; i < cars[n].wheels.length; i++) {

          mycar.wheels[i].pos.x  = cars[n].wheels[i].pos.x;
          mycar.wheels[i].pos.y  = cars[n].wheels[i].pos.y;
          mycar.wheels[i].pos.z =  cars[n].wheels[i].pos.z;

          mycar.wheels[i].quat.x = cars[n].wheels[i].quat.x;
          mycar.wheels[i].quat.y = cars[n].wheels[i].quat.y;
          mycar.wheels[i].quat.z = cars[n].wheels[i].quat.z;
          mycar.wheels[i].quat.w = cars[n].wheels[i].quat.w;
          
          this.getObjMat(mycar.wheels[i]);

            /*
            const skid = 1.0 - cars[n].wheels[i].skidding;

            if (skid > 0.1) {
                const pos = new THREE.Vector3(cars[n].wheels[i].pos.x, cars[n].wheels[i].pos.y, cars[n].wheels[i].pos.z);
                const down = new THREE.Vector3(0, -1, 0);

                const rc = new THREE.Raycaster(pos, down, 0.0, 10.0);
                const pts = rc.intersectObjects([world.track.roadObj]);

                for (let p = 0; p < pts.length; p++) {

                    mycar.addSkidding(pts[p].point, cars[n].wheels[i].contactNormal, skid, time);

                    if ((time - world.lastScreech) > 0.1) {
                        
                        this.playAudio('screech', skid);
                        world.lastScreech = time;
                    }
                }
            }
            */
        }

        mycar.remainingTime = cars[n].remainingTime;

        mycar.speed = cars[n].speed;
        mycar.RPM = cars[n].RPM;
        mycar.damage = cars[n].damage;
        mycar.curSeg = parseInt(cars[n].curSeg);
        mycar.nLaps = parseInt(cars[n].nLaps);

        mycar.nitros = cars[n].nitros;
        mycar.nextNitro = cars[n].nextNitro;
        mycar.nBonus = parseInt(cars[n].nBonus);
        mycar.multiplier = cars[n].multiplier.toFixed(1);

        for (let i = 0; i < cars[n].contacts.length; i++) {
            mycar.addContact(cars[n].contacts[i], cars[n].contactsDMG[i], time);
        }

        if (this.intro === 1) {

          

          if(mycar.remainingTime<=0){
              this.introCount = (-parseInt(mycar.remainingTime)) + 1;
              this.centerText.setText(this.introCount);
          }else{
            this.centerText.setVisible(false);
              this.intro = 2;
          }
      }

        this.nitroTxt.setText(mycar.nitros);
        if (mycar.remainingTime < 0) {
          this.raceTime.setText('0');
        }else {
            const rtxt = mycar.remainingTime.toFixed(1) + ' secs';
            this.raceTime.setText(rtxt);
        }
        const ltxt = parseInt(mycar.nLaps) + '/3 laps ' + (mycar.curSeg +1) + '/' + (world.track.trackPoints.length - 1);
        this.raceLaps.setText(ltxt);
    }

    this.BonusMultiplier.setText('x ' + world.myCar.multiplier);
    /*$('#user-bonus-multiplier').html('x ' + world.myCar.multiplier);*/

    if (woods.length > 0) {
        let c = 0;
        for (let n = 0; n < world.track.woods.length; n++) {
            for (let i = 0; i < world.track.woods[n].objects.length; i++) {
              

                world.track.woods[n].objects[i].pos.x = woods[c].pos.x;
                world.track.woods[n].objects[i].pos.y = woods[c].pos.y;
                world.track.woods[n].objects[i].pos.z = woods[c].pos.z;

                world.track.woods[n].objects[i].quat.x = woods[c].quat.x;
                world.track.woods[n].objects[i].quat.y = woods[c].quat.y;
                world.track.woods[n].objects[i].quat.z = woods[c].quat.z;
                world.track.woods[n].objects[i].quat.w = woods[c].quat.w;
                c++;
            }
        }
    }

    if (turrets.length > 0) {

        for (let n = 0; n < world.track.turrets.length; n++) {

            world.track.turrets[n].headAngle = world.lastCarData.turrets[n].headAngle;

            if(world.track.turrets[n].head)
                world.track.turrets[n].head.rotation[1] = world.track.turrets[n].headAngle - Math.PI / 2;

            var rem = [];
            let j = 0;

            while (j < world.track.turrets[n].shots.length) {
                let fnd = false;

                for (let i = 0; i < world.lastCarData.turrets[n].shots.length; i++) {
                    if (world.track.turrets[n].shots[j].id === world.lastCarData.turrets[n].shots[i].id) {
                        fnd = true;
                        break;
                    }
                }

                if (!fnd) 
                    world.track.turrets[n].shots.splice(j, 1);
                else
                    j++;
            }


            for (let i = 0; i < world.lastCarData.turrets[n].shots.length; i++) {
                let fnd = false;
                for (let j = 0; j < world.track.turrets[n].shots.length; j++) {
                    if (world.track.turrets[n].shots[j].id === world.lastCarData.turrets[n].shots[i].id) {

                      world.track.turrets[n].shots[j].pos.x = world.lastCarData.turrets[n].shots[i].pos.x;
                      world.track.turrets[n].shots[j].pos.y = world.lastCarData.turrets[n].shots[i].pos.y;
                      world.track.turrets[n].shots[j].pos.z = world.lastCarData.turrets[n].shots[i].pos.z;
                      fnd = true;
                      break;
                    }
                }

                if (!fnd) 
                    world.track.turrets[n].shots.push({id : world.lastCarData.turrets[n].shots[i].id, 
                                                       pos : {x: world.lastCarData.turrets[n].shots[i].pos.x, y: world.lastCarData.turrets[n].shots[i].pos.y, z: world.lastCarData.turrets[n].shots[i].pos.z},
                                                       scale : {x: world.track.turrets[n].projSize, y: world.track.turrets[n].projSize, z: world.track.turrets[n].projSize},
                                                       matrix : UT.MAT4_IDENTITY()
                                                      });
            }
        }
    }





    if (bonuses.length > 0) {

        for (let n = 0; n < world.track.bonuses.length; n++) {
            world.track.bonuses[n].taken = bonuses[n].taken;
            world.track.bonuses[n].size = bonuses[n].scale;

            world.track.bonuses[n].scale.x=world.track.bonuses[n].size;
            world.track.bonuses[n].scale.y=world.track.bonuses[n].size;
            world.track.bonuses[n].scale.z=world.track.bonuses[n].size;

            this.getObjMat(world.track.bonuses[n]);

            if (bonuses[n].taken !== 0) {
                if (world.track.bonuses[n].enabled === true) {
                    world.track.bonuses[n].enabled = false;

                    /*
                    this.playAudio('coin', 0.8);
                    */

                    this.userBonus.setText('x' + world.myCar.nBonus);
                }
            }else if (world.track.bonuses[n].enabled === false) {
                world.track.bonuses[n].enabled = true;
                this.userBonus.setText('x' + world.myCar.nBonus);
            }
        }
    }


    /*
    if (springs.length > 0) {
        let c = 0;
        for (let n = 0; n < world.track.springs.length; n++) {
            world.track.springs[n].obj.object.position.set(springs[n].pos.x, springs[n].pos.y, springs[n].pos.z);
            world.track.springs[n].obj.object.quaternion.set(springs[n].quat.x, springs[n].quat.y, springs[n].quat.z, springs[n].quat.w);
        }
    }

    if (ropes.length > 0) {
        let c = 0;
        for (let n = 0; n < world.track.ropes.length; n++) {
            world.track.ropes[n].obj.object.position.set(ropes[n].pos.x, ropes[n].pos.y, ropes[n].pos.z);
            world.track.ropes[n].obj.object.quaternion.set(ropes[n].quat.x, ropes[n].quat.y, ropes[n].quat.z, ropes[n].quat.w);
        }
    }
    */
}




  update(ts) {
    const now = new Date().getTime();

    if (this.startLine) {
      for (const obj of this.startLine) {
        obj[1].update(ts);
      }
    }

    if (this.bonusObject) {
      for (const obj of this.bonusObject) {
        obj[1].update(ts);
      }
    }

    if (this.jumperObject) {
      for (const obj of this.jumperObject) {
        obj[1].update(ts);
      }
    }

    if (this.world.track) {
     
      for (const obj of this.world.track.terrain.mesh) {
        obj[1].update(ts);
      }

      for (let n = 0; n < this.world.track.bonuses.length; n++) {
        this.world.track.bonuses[n].angles.y += ts / 1000.0;
      }

      for (let n = 0; n < this.world.track.woods.length; n++) {
        this.world.track.woods[n].mesh.update(ts);
      }
    }

    
    if (this.world.myCar) {

      this.updateCars(this.world, now);
    
      if (this.world.myCar.ChassisMesh) {
        
        if(this.world.myCar.ChassisMesh)
        {
          for (const obj of this.world.myCar.ChassisMesh) {
            obj[1].update(ts);
          }
        }

        if(this.world.myCar.tireMesh)
        {
          if (this.world.myCar.tireMesh) {
            for (const obj of this.world.myCar.tireMesh) {
              obj[1].update(ts);
            }
          }
        }
        this.updateCamera(this.world.myCar, null, null, [], ts);
      }
    }
    
    if (this.roadObj)
      this.roadObj.update(ts);

    if (this.roadWall)
      this.roadWall.update(ts);


    if(this.skySphere)
    {
      this.skySphere.position[0] = this.camera.position[0];
      this.skySphere.position[1] = this.camera.position[1];
      this.skySphere.position[2] = this.camera.position[2];
    }

  }

  drawTrack(track) {

    
    for (const obj of track.terrain.mesh) {
      obj[1].draw();
    }
    

    if (this.startLine) {
      for (const obj of this.startLine) {
        obj[1].draw();
      }
    }

    if(this.mode == 0)
    {
      if(track.wallMesh)
      {
        for (const obj of track.wallMesh) {
          obj[1].draw();
        }  
      }
    }else{
      for(let wall of track.walls)
      {
         for (const obj of track.wallObject) {
          gfx3MeshRenderer.drawMesh(obj[1], wall.matrix);
         }
      }
    }

    for (let n = 0; n < track.woods.length; n++) {

      for (let i = 0; i < track.woods[n].objects.length; i++) {

        this.getObjMat(track.woods[n].objects[i]);
        gfx3MeshRenderer.drawMesh(track.woods[n].mesh, track.woods[n].objects[i].matrix);
      }
    }

    for (let n = 0; n < track.bonuses.length; n++) {

      if(!track.bonuses[n].enabled)
        continue;

      for (const obj of track.bonusObject) {
        gfx3MeshRenderer.drawMesh(obj[1], track.bonuses[n].matrix);
      }
    }

    for (let n = 0; n < track.jumpers.length; n++) {

      for (const obj of track.jumperObject) {
        gfx3MeshRenderer.drawMesh(obj[1], track.jumpers[n].matrix, track.jumpers[n].nmatrix);
      }
    }
    
    const a = UT.VEC3_CREATE(0,0,0);
    const p = UT.VEC4_CREATE(0,0,1);
    const s = UT.VEC4_CREATE(1,1,1);

    for (let n = 0; n < track.turrets.length; n++) {

      for (const obj of track.turrets[n].main) {
        obj[1].draw();
      }

      for (let i = 0; i < track.turrets[n].shots.length; i++) {

        UT.VEC3_SET(p, track.turrets[n].shots[i].pos.x, track.turrets[n].shots[i].pos.y, track.turrets[n].shots[i].pos.z);
        UT.VEC3_SET(s, track.turrets[n].shots[i].scale.x, track.turrets[n].shots[i].scale.y, track.turrets[n].shots[i].scale.z);
        UT.MAT4_TRANSFORM_N(p,a,s,track.turrets[n].shots[i].matrix)

        if(track.turrets[n].shotModel)
        {
          for (const obj of track.turrets[n].shotMesh) {
            gfx3MeshRenderer.drawMesh(obj[1], track.turrets[n].shots[i].matrix);
          }

        }
        else
          gfx3MeshRenderer.drawMesh(track.turrets[n].shotMesh, track.turrets[n].shots[i].matrix);
      }
      
    }
  }

  drawUI()
  {
    for(let d of this.digits)
    {
      d.draw();
    }
  }

  draw() {

    gfx3MeshRenderer.enableDirLight(this.lightDir);

    gfx3MeshRenderer.dirLightColor= UT.VEC4_CREATE(0.2, 0,  0.2, 0.0);
    gfx3MeshRenderer.pointLight0Color= UT.VEC4_CREATE(0.2, 0.2, 0.00, 10.0);

    document.getElementById('mode').innerHTML =this.mode;
    document.getElementById('bind1').innerHTML =gfx3MeshRenderer.binds;
    
    
    document.getElementById('time').innerHTML =parseInt(gfx3Manager.lastRenderTime);
    document.getElementById('fps').innerHTML = (1000 / (gfx3Manager.lastRenderTime)).toFixed(2);

    if(this.skySphere)
      this.skySphere.draw();
    
    if (this.world.track)
      this.drawTrack(this.world.track);

    if (this.world.myCar) {
      
      if (this.world.myCar.ChassisMesh) {
        for (const obj of this.world.myCar.ChassisMesh) {
          gfx3MeshRenderer.drawMesh(obj[1], this.world.myCar.matrix);
        }


        const ofs = UT.QUAT_MULTIPLY_BY_VEC3(this.world.myCar.wquat, UT.VEC3_CREATE(-this.world.myCar.chassisWidth /2, 0, this.world.myCar.chassisLength + 0.2 ));
        const p=UT.VEC3_CREATE(this.world.myCar.wpos[0] + ofs[0] , this.world.myCar.wpos[1] + 2, this.world.myCar.wpos[2]+ ofs[2]);

        

        gfx3MeshRenderer.enablePointLight(p, 0);
      }

      if (this.world.myCar.tireMesh) {
        for (let w of this.world.myCar.wheels) {
          for (const obj of this.world.myCar.tireMesh) {
            gfx3MeshRenderer.drawMesh(obj[1], w.matrix);
          }
        }
      }

      this.drawText(Math.abs(this.world.myCar.speed).toFixed(0).toString())
    }
    
    if (this.roadObj)
      this.roadObj.draw();




    if (this.roadWall)
      this.roadWall.draw();


    this.drawUI();

    //this.skybox.draw();
    //gfx3DebugRenderer.drawGrid(UT.MAT4_ROTATE_X(Math.PI * 0.5), 20, 1);
  }


  handleKeyUp(e) {

    if(e.code === 'KeyB')
      gfx3MeshRenderer.binds ^= 1;
    
    if(e.code === 'KeyR')
      this.mode ^= 1;

    if (this.gameStat !== 1)
      return true;

    if (e.code == 'KeyC') {
      this.camMode++;
      if (this.camMode > 4)
        this.camMode = 1;
    }

    if (this.keysActions[e.code]) {

      this.pressed[this.keysActions[e.code]] = false;

      if ((this.webSocket !== null) && (this.webSocket.readyState == 1))
        this.webSocket.send('{"msg" : "action", "data":{   "key" : "' + this.keysActions[e.code] + '", "state": false }}');
    }

  }

  handleKeyDown(e) {

    
    if (this.gameStat != 1)
      return

    if (this.intro == 0)
    {
      this.intro = 1;
      this.centerText.setVisible(true);
      this.webSocket.send('{"msg" : "startrace", "data":{}}');
      /*
      this.webSocket.send('{"msg" : "action", "data":{   "key" : "acceleration", "state": true }}');
      const self = this;

      setInterval(function(){

        if(!this.steer)
        {
          self.webSocket.send('{"msg" : "action", "data":{   "key" : "left", "state": true }}');
          setTimeout(function(){ self.webSocket.send('{"msg" : "action", "data":{   "key" : "left", "state": false }}'); }, 800)
          this.steer=true;
        }else{
          self.webSocket.send('{"msg" : "action", "data":{   "key" : "right", "state": true }}');
          setTimeout(function(){ self.webSocket.send('{"msg" : "action", "data":{   "key" : "right", "state": false }}'); }, 800)
          this.steer=false;
        }
      }, 1500)
      */
    }

    if (this.keysActions[e.code]) {

      if (!this.pressed[this.keysActions[e.code]]) {
        if ((this.webSocket !== null) && (this.webSocket.readyState == 1)) {
          this.webSocket.send('{"msg" : "action", "data":{   "key" : "' + this.keysActions[e.code] + '", "state": true }}');
          this.pressed[this.keysActions[e.code]] = true;
        }
      }

      if ((this.gameStat == 2) && (this.pressed["acceleration"])) {
        window.location.reload();
      }
    }

          
    e.stopImmediatePropagation();
    e.returnValue = false;
    e.preventDefault();
    e.stopPropagation();
    
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

export { CCScreen };
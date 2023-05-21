import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';


import { gfx3DebugRenderer } from '../../lib/gfx3/gfx3_debug_renderer';
import { inputManager } from '../../lib/input/input_manager';
import { UT } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';

import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { gfx3Manager } from '../../lib/gfx3/gfx3_manager';
import { Gfx3Material } from '../../lib/gfx3_mesh/gfx3_mesh_material';
import { Gfx3Mesh } from '../../lib/gfx3_mesh/gfx3_mesh';
import { Gfx3MeshObj } from '../../lib/gfx3_mesh/gfx3_mesh_obj';
import { gfx3MeshRenderer } from '../../lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3MeshShapeCylinder } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_cylinder';
import { Gfx3MeshShapeSphere } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_sphere';

import { uiManager } from '../../lib/ui/ui_manager';
import { UIWidget } from '../../lib/ui/ui_widget';
import { UISprite } from '../../lib/ui_sprite/ui_sprite';
import { UIText } from '../../lib/ui_text/ui_text';

import { gfx2Manager } from '../../lib/gfx2/gfx2_manager';
import { gfx2TextureManager } from '../../lib/gfx2/gfx2_texture_manager';
import { Gfx2SpriteJAS } from '../../lib/gfx2_sprite/gfx2_sprite_jas'

import { InPlace } from './inplace';

import { CircuitRace, initWallet } from './cc.js';

import { screenManager } from '../../lib/screen/screen_manager';
import { TrackSelect } from './games_screen';

import { Gfx3MeshPool } from './gfx3_mesh_pool';



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




class PlayScreen extends Screen {
  constructor() {
    super();


    this.camera = new Gfx3Camera(0);
    

    this.camera.setPosition(0,10,0);

    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];

    this.camera_fov = 100;


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
    this.introCount = 0;

    this.nitroSphere = new Gfx3MeshShapeSphere(0.5, 8,8, UT.VEC2_CREATE(1,1));
    this.contactSphere = new Gfx3MeshShapeSphere(0.1, 8,8, UT.VEC2_CREATE(1,1));
    this.skidMesh = new Gfx3MeshShapeCylinder(0.2, 0.1, 4, UT.VEC2_CREATE(1,1));

    this.nitroPool = new Gfx3MeshPool(this.nitroSphere, 50);
    this.contactPool= new Gfx3MeshPool(this.contactSphere, 100);
 

    

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


    this.centerText = new UIText('margin:auto');
    this.messageText = new UIText('margin:auto');
    this.userAccount= new UIText('margin:auto');
    
    this.steelIcon = new UISprite();
    this.userBonus = new UIText();
    this.BonusMultiplier = new UIText();

    this.nitroIcon = new UISprite();
    this.nitroTxt = new UIText();
    this.raceTime = new UIText();
    this.raceLaps = new UIText();

    this.backBtn = new BackBtn();

    this.rpm = [];
    this.nitros = [];
    this.dmg = [];



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
          if(text[n-nnc]>= '0' && text[n-nnc] <= '9')
          {
            const nm = parseInt(text[n-nnc]);
            this.digits[n].setTexture(this.digitsTex[nm]);
          }else{
            this.digits[n].setTexture(this.digitsTex[0]);
          }

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
        const w = this.digitsTex[0].width;
        const h = this.digitsTex[0].height;

        this.digits[n] = new Gfx2SpriteJAS();
        this.digits[n].setTexture(this.digitsTex[0]);
        this.digits[n].position[0] = n*50 - 250; 
        this.digits[n].position[1] = 100;
        this.digits[n].position[2] = 0;
        this.digits[n].animations[0] = { name: '', frames: [{x: 0.0,y: 0.0, width: w, height: h}], frameDuration: 100000 };
        this.digits[n].currentAnimation=this.digits[0].animations[0];
        this.digits[n].width = w;
        this.digits[n].height = h;
      }
  }


  async loadUI()
  {
    
    this.dmg0 = await gfx2TextureManager.loadTexture(this.site + "/assets/textures/dmg_ui.png");
    this.dmg1 = await gfx2TextureManager.loadTexture(this.site + "/assets/textures/dmg_ui2.png");

    this.rpm0 = await gfx2TextureManager.loadTexture(this.site + "/assets/textures/engine_s.png");
    this.rpm1 = await gfx2TextureManager.loadTexture(this.site + "/assets/textures/engine2_s.png");

    this.nitro0 = await gfx2TextureManager.loadTexture(this.site + "/assets/textures/nitro_ui_.png");
    this.nitro1 = await gfx2TextureManager.loadTexture(this.site + "/assets/textures/nitro_ui2_s.png");
    this.nitro2 = await gfx2TextureManager.loadTexture(this.site + "/assets/textures/nitro_ui3_s.png");

    this.dmg[0] = new Gfx2SpriteJAS();
    this.dmg[0].setTexture(this.dmg0);
    this.dmg[0].position[0] = 200;//-90;
    this.dmg[0].position[1] = -100;// -45;
    this.dmg[0].position[2] = 0;
    this.dmg[0].width = this.dmg0.width;
    this.dmg[0].height = this.dmg0.height;

    this.dmg[0].animations[0] = { name: '', frames: [{x: 0.0, y: 0, width: this.dmg[0].width, height: this.dmg[0].height}], frameDuration: 100000 };
    this.dmg[0].currentAnimation = this.dmg[0].animations[0];

    this.dmg[1] = new Gfx2SpriteJAS();
    this.dmg[1].setTexture(this.dmg1);
    this.dmg[1].position[0] = 200;//-90;
    this.dmg[1].position[1] = -100;// -45;
    this.dmg[1].position[2] = 0;
    this.dmg[1].width = this.dmg1.width;
    this.dmg[1].height = this.dmg1.height;

    this.dmg[1].animations[0] = { name: '', frames: [{x: 0.0, y: 0, width: this.dmg[1].width, height: this.dmg[1].height}], frameDuration: 100000 };
    this.dmg[1].currentAnimation = this.dmg[1].animations[0];
    

    this.rpm[0] = new Gfx2SpriteJAS();
    this.rpm[0].setTexture(this.rpm0);
    this.rpm[0].position[0] = -250;//-90;
    this.rpm[0].position[1] = 170;// -45;
    this.rpm[0].position[2] = 0;
    this.rpm[0].width = this.rpm0.width;
    this.rpm[0].height = this.rpm0.height;

    this.rpm[0].animations[0] = { name: '', frames: [{x: 0.0, y: 0, width: this.rpm[0].width, height: this.rpm[0].height}], frameDuration: 100000 };
    this.rpm[0].currentAnimation = this.rpm[0].animations[0];

    this.rpm[1] = new Gfx2SpriteJAS();
    this.rpm[1].setTexture(this.rpm1);
    this.rpm[1].position[0] = -250;//-90;
    this.rpm[1].position[1] = 170;// -45;
    this.rpm[1].position[2] = 0;
    this.rpm[1].width = this.rpm1.width;
    this.rpm[1].height = this.rpm1.height;

    this.rpm[1].animations[0] = { name: '', frames: [{x: 0, y: 0, width: this.rpm[1].width, height: this.rpm[1].height}], frameDuration: 100000 };
    this.rpm[1].currentAnimation = this.rpm[1].animations[0];

    this.nitros[0] = new Gfx2SpriteJAS();
    this.nitros[0].setTexture(this.nitro0);
    this.nitros[0].position[0] = -250;//-90;
    this.nitros[0].position[1] = 220;// -45;
    this.nitros[0].position[2] = 0;
    this.nitros[0].width = this.nitro0.width;
    this.nitros[0].height = this.nitro0.height;

    this.nitros[0].animations[0] = { name: '', frames: [{x: 0.0, y: 0.0, width: this.nitros[0].width, height: this.nitros[0].height}], frameDuration: 100000 };
    this.nitros[0].currentAnimation = this.nitros[0].animations[0];

    this.nitros[1] = new Gfx2SpriteJAS();
    this.nitros[1].setTexture(this.nitro1);
    this.nitros[1].position[0] = -250;//-90;
    this.nitros[1].position[1] = 220;// -45;
    this.nitros[1].position[2] = 0;
    this.nitros[1].width = this.nitro1.width;
    this.nitros[1].height = this.nitro1.height;

    this.nitros[1].animations[0] = { name: '', frames: [{x: 0, y: 0, width: this.nitros[1].width, height: this.nitros[1].height}], frameDuration: 100000 };
    this.nitros[1].currentAnimation = this.nitros[1].animations[0];


    this.nitros[2] = new Gfx2SpriteJAS();
    this.nitros[2].setTexture(this.nitro2);
    this.nitros[2].position[0] = -250;//-90;
    this.nitros[2].position[1] = 220;// -45;
    this.nitros[2].position[2] = 0;
    this.nitros[2].width = this.nitro2.width;
    this.nitros[2].height = this.nitro2.height;

    this.nitros[2].animations[0] = { name: '', frames: [{x: 0, y: 0, width: this.nitros[2].width, height: this.nitros[2].height}], frameDuration: 100000 };2
    this.nitros[2].currentAnimation = this.nitros[2].animations[0];

    await this.loadDigitFont();

  }


  async loadStartLine(track, startname) {

    this.startLine = new Gfx3MeshObj();
    await this.startLine.loadFromFile(this.site + "/assets/mesh/" + startname + ".obj", this.site + "/assets/mesh/" + startname + ".mtl");

    const anglesA = UT.QUATERNION_TO_EULER({x : track.trackPoints[track.startPts].rot.x, y: track.trackPoints[track.startPts].rot.y, z: track.trackPoints[track.startPts].rot.z, w: track.trackPoints[track.startPts].rot.w});
    const euler =[anglesA.yaw, anglesA.pitch, anglesA.roll];
    //angles[1] -= Math.PI /2;

    for (let obj of this.startLine) {
      obj[1].setPosition(track.trackPoints[0].pos.x, track.trackPoints[0].pos.y, track.trackPoints[0].pos.z);
      obj[1].setRotation(euler[0], euler[1], euler[2]);
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
      this.roadMaT.roughnessMap = await gfx3TextureManager.loadTexture8bit(this.site + "/assets/textures/" + track.roadRought)
    }

    if (track.roadEmm) {
      this.roadMaT.emissiveMap = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/" + track.roadEmm)
      this.roadMaT.emissive = UT.VEC3_CREATE(0.4,0.4,0.4);
      this.roadMaT.emissiveIntensity = 1.0;
    }

    this.roadMaT.update = true;

    const arrowTex = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/arrows.png");
    const arrowsNormals = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/arrows_n.png");

    this.arrowMat = new Gfx3Material({ texture: arrowTex, normalMap: arrowsNormals, normalIntensity: 1.0 });

  }

  createTrackGeometry(track) {
    this.roadObj = new Gfx3Mesh();
    this.roadObj.setMaterial(this.roadMaT);
    this.roadObj.build(track.positions, track.texcoords, track.indices, UT.VEC2_CREATE(track.roadTexScale.x * 0.4, track.roadTexScale.y ));

    this.roadBuffer = new Float32Array(this.roadObj.vertices);

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

    
    car.matrix = UT.MAT4_IDENTITY();


    this.getObjMat(car);

    for (let n = 0; n < 4; n++) {

      car.wheels[n].matrix = UT.MAT4_IDENTITY();

      this.getObjMat(car.wheels[n]);
    }

    car.massVehicle = car.carDef.massVehicle;

  }
  async delTrack(track) {

    if (track.bonusObject) 
      track.bonusObject.destroy();
    
    if (track.jumperObject) 
      track.jumperObject.destroy();
    
    if (track.wallObject) 
      track.wallObject.destroy();

    track.bonusObject  = null;
    track.jumperObject  = null;
    track.wallObject = null;

    //track.wallMesh.destroy();
    //track.wallMesh=null;

    track.terrain.mesh.destroy();
    track.terrain.mesh = null;

    if(this.skySphere)
    {
      this.skySphere.delete();
      this.skySphere=null;
    }
    

    for (let wood of track.woods) {
        wood.mesh.delete();
        /*this.woodMaterial.destroy();*/
    }

    for (let turret of track.turrets) {
        turret.main.destroy();

      if((turret.shotModel)&&(turret.shotModel.length>0))
        turret.shotMesh.destroy();
      else
        turret.shotMesh.delete();
    }

    
    /*
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
    */

    track.trackPoints = [];
    track.woods = [];
    track.bonuses = [];
    track.jumpers = [];
    track.turrets = [];
 }


  async addTrack(track) {

    const mats = [];

    for(let w of track.walls)
    {
      w.matrix = UT.MAT4_IDENTITY();
      this.getObjMat(w);
      mats.push(w.matrix);
    }

    //track.wallMesh = track.wallObject.dupe(mats);


    if ((track.woodDefs) && (track.woodDefs.length > 0)) {

      for (let n = 0; n < track.woodDefs.length; n++) {

        const wood = track.addWoods(track.woodDefs[n].ptIdx, track.woodDefs[n].num, track.woodDefs[n].width, track.woodDefs[n].radius, track.woodDefs[n].mass, track.woodDefs[n].offset);
        wood.mesh = new Gfx3MeshShapeCylinder(wood.radius, wood.width * 2, 24, UT.VEC2_CREATE(1, 1));
        wood.mesh.setMaterial(this.woodMaterial);

        for(let o of wood.objects)
        {
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
        bonus.matrix = UT.MAT4_IDENTITY();
      }
    }

    for (let n = 0; n < track.loopings.length; n++) {
      for (let i = 0; i < track.loopings[n].bonuses.length; i++) {
        const bonus = track.addBonus(track.loopings[n].bonuses[i].ptIdx, track.loopings[n].bonuses[i].type, track.loopings[n].bonuses[i].time, track.loopings[n].bonuses[i].offset, track.loopings[n].bonuses[i].scale);
        bonus.matrix = UT.MAT4_IDENTITY();
      }
    }

    if ((track.jumpersDefs) && (track.jumpersDefs.length > 0)) {

      for (let n = 0; n < track.jumpersDefs.length; n++) {
        const jumper = track.addJumper(track.jumpersDefs[n].ptIdx, track.jumpersDefs[n].offset, track.jumpersDefs[n].angle, track.jumpersDefs[n].size);
        jumper.matrix = UT.MAT4_IDENTITY();

        UT.MAT4_TRANSLATE(jumper.pos.x, jumper.pos.y, jumper.pos.z, jumper.matrix);
        InPlace.MAT4_MULTIPLY_BY_QUAT(jumper.matrix, jumper.rot.x, jumper.rot.y, jumper.rot.z, jumper.rot.w);
        InPlace.MAT4_SCALE(jumper.matrix, jumper.size.x, jumper.size.y, jumper.size.z);

        jumper.nmatrix=UT.MAT4_IDENTITY();
        InPlace.MAT4_MULTIPLY_BY_QUAT(jumper.nmatrix, jumper.rot.x, jumper.rot.y, jumper.rot.z, jumper.rot.w);
  
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
          turret.shotMesh.material.lightning = true;
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

  findRoadIntersect(track, o)
  {
    const dir = UT.VEC3_CREATE(0,-1,0);
    const inter = UT.VEC3_CREATE(0,0,0);

    for(let i=0;i<this.roadBuffer.length;i+= 14 * 3 )
    {
      const v1 = this.roadBuffer.subarray(i + 14 * 0, i + 14 * 0 + 3);
      const v2 = this.roadBuffer.subarray(i + 14 * 1, i + 14 * 1 + 3);
      const v3 = this.roadBuffer.subarray(i + 14 * 2, i + 14 * 2 + 3);
      if(UT.RAY_TRIANGLE(o, dir, v1, v2, v3, false, inter))
      {
        return inter;
      }
    }

    return null;


  }

  async loadGame(data)
  {
    await this.world.loadTrack(data.trackname, this.site);

    this.skidMesh.material.texture = await gfx3TextureManager.loadTexture(this.site + "/assets/textures/skid.png");
    this.skidMesh.material.lightning = true;
    this.skidMesh.material.update = true;

    this.skidPool= new Gfx3MeshPool(this.skidMesh, 100);

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

    await this.createTrack();
    await this.addTrack(this.world.track);

    if(data.np == 1)
    {
      const carDef = await this.wallet.getCar(data.carid, data.cartype);
      this.world.myCar = await this.world.createCar(carDef);
      await this.loadCar(this.world.myCar);
      this.world.cars.push(this.world.myCar);
    }else{
      const carDef = await this.wallet.getCar(data.carid, data.cartype, data.account);
      const car1 = await this.world.createCar(carDef);
      await this.loadCar(car1);
      this.world.cars.push(car1);

      const response = await fetch(this.site + '/waitPlayer', { method: 'GET', credentials: 'include', cache: "no-store" });
      const player = await response.json();

      const carDef2 = await this.wallet.getCar(player.carid, player.cartype, player.account);
      const car2 = await this.world.createCar(carDef2);
      await this.loadCar(car2);
      this.world.cars.push(car2);

      if(!data.amhost)
        this.world.myCar = car2;
      else
        this.world.myCar = car1;
    }

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
      self.wallet.newAlert('unable to connect server ' + serverPath + ' ' + e.message);
      self.gameMessage = 'server connection error';
      self.messageText.setText(self.gameMessage);
      self.messageText.setVisible(true);
      return;
    }

    this.webSocket.onerror = function (event) {

      alert('socket error on server ' + serverPath + ' ' + event);

      self.gameStat = 2;
      self.gameMessage = 'server connection error';
      self.wallet.newAlert("server connection error");
      self.webSocket.close();

      self.messageText.setText(self.gameMessage);
      self.messageText.setVisible(true);
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

            self.messageText.setText('unable to parse message data ' + e.message);
            self.messageText.setVisible(true);
            return;
          }

          if (obj.msg == "gameover") {
            self.gameStat = 2;
            self.gameMessage = obj.data;
            self.webSocket.close();


            self.messageText.setText(self.gameMessage);
            self.messageText.setVisible(true);

          } else if (obj.msg == "finished") {
            self.gameStat = 3;
            self.gameMessage = obj.data;
            self.webSocket.close();

            self.messageText.setText(self.gameMessage);
            self.messageText.setVisible(true);

          } else if (obj.msg == "wait") {
            self.messageText.setText('waiting for player');
            self.messageText.setVisible(true);
          } else if (obj.msg == "error") {
            self.messageText.setText("error : " + obj.data);
            self.messageText.setVisible(true);

          } else if (obj.msg == "queued") {
            self.messageText.setText('server full, waiting for ' + obj.data + ' instance to finish');
            self.messageText.setVisible(true);
          } else if (obj.msg == "ready") {
            self.messageText.setVisible(false);
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
    this.introCount = 0;
    this.mode = 0;
    
    this.digitsTex=[];
    this.digits=[];
    this.pressed = {};

    this.wallet = await initWallet(this.site);
    this.wallet.engine = this;
    this.wallet.world = this.world;

    const response = await fetch(this.site + '/myGame', { method: 'GET', credentials: 'include', cache: "no-store" });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    await this.steelIcon.loadTexture(this.site + "/assets/img/steel-icon.png");
    await this.nitroIcon.loadTexture(this.site + "/assets/img/nitro-icon.png");

    uiManager.addWidget(this.backBtn, 'position:absolute; left:90%; top:90%; height:50px;');

    this.backBtn.getNode().addEventListener('click', function(){
      screenManager.requestSetScreen(new TrackSelect(), { });
    })

    await this.loadUI();


    
    uiManager.addWidget(this.userAccount, 'position:absolute; top:0; left:0px; right:0; width:64px; height:50px;width:150px;');
    uiManager.addWidget(this.steelIcon, 'position:absolute; top:0; left:160px; right:0; width:64px; height:50px;background-size: contain;');
    uiManager.addWidget(this.userBonus, 'position:absolute; top:0; left:220px; right:0; height:50px; width:100px');
    uiManager.addWidget(this.BonusMultiplier, 'position:absolute; top:0; left:320px; right:0; height:50px; width:100px');

    uiManager.addWidget(this.nitroIcon, 'position:absolute; top:0; left: 440px; right:0; height:50px; width:64px; background-size: contain;');
    uiManager.addWidget(this.nitroTxt, 'position:absolute; top:0; left: 500px; right:0; height:50px; width:100px');

    uiManager.addWidget(this.raceTime, 'position:absolute; top:50px; left:0; right:0; height:50px;width:50%');
    uiManager.addWidget(this.raceLaps, 'position:absolute; top:50px; left:50%; right:0; height:50px;width:50%');

    uiManager.addWidget(this.messageText, 'position:absolute; top:100px; left:0; right:0; height:50px;width:100%; font-size:14px;color:red;display:flex-grid;');

    uiManager.addWidget(this.centerText, 'position:absolute; top:50%; left:25%; right:0; height:250px;width:50%; font-size:72px;display:flex-grid;');

    
    
    this.messageText.setVisible(false);

    this.userBonus.setText('x0');
    this.BonusMultiplier.setText('x0');
    this.nitroTxt.setText('x0');
    this.raceTime.setText('0 sec');
    this.raceLaps.setText('0/3');
    this.centerText.setText('wait');
    this.userAccount.setText(this.wallet.myAccount);

    this.wt = UT.VEC3_CREATE(0.0, 0.0, 0.0);
    this.lastCamPos= UT.VEC3_CREATE(0, 0.0, 0.0);
    this.camOfset = UT.VEC3_CREATE(0, 2.5, -2.5);
    this.frontOfset = UT.VEC3_CREATE(0, 0, 5);
    this.frontOfset2 = UT.VEC3_CREATE(0, 1.3, 1.2);
    this.forwardVec = UT.VEC3_CREATE(0, 0, 1.0);
    this.tmpMat = UT.MAT4_IDENTITY();

    //gfx3MeshRenderer.setShadowSourceProj(600, 200);

    await this.loadGame(data);
   
    this.initGame(data.serverPath, data.sessh, data.amhost, -1);

    this.centerText.setText('press');

    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleMouseUpCb = this.handleMouseUp.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);

    this.handleKeyDownCb = this.handleKeyDown.bind(this);
    this.handleKeyUpCb = this.handleKeyUp.bind(this);


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

    if((this.webSocket)&&(this.webSocket.readyState == 1 ))
      this.webSocket.close();

    this.delTrack(this.world.track);

    if(this.roadObj){
      this.roadObj.delete();
      this.roadObj=null;
    }
    
    if(this.roadWall){
      this.roadWall.delete();
      this.roadWall=null;
    }
    if(this.startLine){
      this.startLine.destroy();
      this.startLine=null;
    }

    if(this.world.myCar)
    {
      this.delCar(this.world.myCar);
      this.world.myCar= null;
    }

    this.nitroPool.delete();
    this.contactPool.delete();
    this.skidPool.delete();

    /*
    let d;
    while(d=this.digits.pop()){ d.delete(); }
    */
       
    gfx2TextureManager.deleteTexture(this.site + "/assets/textures/dmg_ui.png");
    gfx2TextureManager.deleteTexture(this.site + "/assets/textures/dmg_ui2.png");

    gfx2TextureManager.deleteTexture(this.site + "/assets/textures/engine_s.png");
    gfx2TextureManager.deleteTexture(this.site + "/assets/textures/engine2_s.png");

    gfx2TextureManager.deleteTexture(this.site + "/assets/textures/nitro_ui_.png");
    gfx2TextureManager.deleteTexture(this.site + "/assets/textures/nitro_ui2_s.png");
    gfx2TextureManager.deleteTexture(this.site + "/assets/textures/nitro_ui3_s.png");

    for(let n=0; n< 10;n++)
    {
        gfx2TextureManager.deleteTexture(this.site + "/assets/fonts/"+n+".png");
    }
    
    uiManager.removeWidget(this.userAccount);
    uiManager.removeWidget(this.messageText);
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

    document.removeEventListener('keydown', this.handleKeyDownCb);
    document.removeEventListener('keyup', this.handleKeyUpCb);

  }


  
  getObjMat (obj)
  {
    //const angles = UT.QUAT_TO_EULER(UT.VEC4_CREATE(quat.x, quat.y, quat.z, quat.w), "YXZ");

    obj.matrix=UT.MAT4_IDENTITY();
    
    UT.MAT4_TRANSLATE( obj.pos.x, obj.pos.y, obj.pos.z, obj.matrix);

    if(obj.quat)
      InPlace.MAT4_MULTIPLY_BY_QUAT(obj.matrix, obj.quat.x, obj.quat.y, obj.quat.z, obj.quat.w);

    if(obj.scale)
      InPlace.MAT4_SCALE(obj.matrix,obj.scale.x, obj.scale.y, obj.scale.z);
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

      const wcamOfset = InPlace.QUAT_MULTIPLY_BY_VEC3([myCar.quat.x,myCar.quat.y, myCar.quat.z, myCar.quat.w], this.camOfset );
      InPlace.QUAT_MULTIPLY_BY_VEC3([myCar.quat.x,myCar.quat.y, myCar.quat.z, myCar.quat.w], this.frontOfset, this.wt);
      const camDest = UT.VEC3_ADD([myCar.pos.x, myCar.pos.y, myCar.pos.z], wcamOfset);

      switch (this.camMode) {
        case 1:
          this.camera.setPosition(camDest[0], camDest[1], camDest[2]);
          this.camera.lookAt(myCar.pos.x, myCar.pos.y, myCar.pos.z);
          this.lastCamAngle = null;
          break;
        case 2:

        const wfrontVec = InPlace.QUAT_MULTIPLY_BY_VEC3([myCar.quat.x,myCar.quat.y, myCar.quat.z, myCar.quat.w], this.forwardVec);
          const carAngle = Math.atan2(wfrontVec[0], wfrontVec[2]) - Math.PI/2;
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

          this.camera.setPosition(myCar.pos.x - Math.cos(curAngle) * d, myCar.pos.y + 2.5, myCar.pos.z + Math.sin(curAngle) * d);
          this.camera.setRotation(0, -(curAngle-Math.PI/2), 0);

          this.lastCamAngle = curAngle;
          //this.camera.lookAt(p.x, p.y, p.z);
          break;
        case 3:
          this.camera.setPosition(camDest[0], myCar.pos.y + 8, camDest[2]);
          this.camera.lookAt(myCar.pos.x + this.wt[0], myCar.pos.y + this.wt[1], myCar.pos.z + this.wt[2]);
          this.lastCamAngle = null;
          break;
        case 4:
          //const frontOfset = new THREE.Vector3(0, 1.3, 1.2).applyQuaternion(q);
          //const frontOfset = new THREE.Vector3(0, 1.3, 1.2).applyMatrix4(m);
          const wfrontVec2 = InPlace.QUAT_MULTIPLY_BY_VEC3([myCar.quat.x,myCar.quat.y, myCar.quat.z, myCar.quat.w], this.frontOfset2);
          //= q,
          this.camera.setPosition(myCar.pos.x + wfrontVec2[0], myCar.pos.y + wfrontVec2[1], myCar.pos.z + wfrontVec2[2]);
          this.camera.lookAt(myCar.pos.x + this.wt[0], myCar.pos.y + this.wt[1], myCar.pos.z + this.wt[2]);
          this.lastCamAngle = null;
          break;
      }

    //}

    UT.VEC3_SET(this.lastCamPos , myCar.pos.x, myCar.pos.y, myCar.pos.z);

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

        if ((world.deltaTime !== null) && (delta < world.deltaTime)) {

          mycar.wheels[i].pos.x = cars[n].wheels[i].pos.x + world.dataDelta.cars[n].wheels[i].pos.x * delta / world.deltaTime;
          mycar.wheels[i].pos.y = cars[n].wheels[i].pos.y + world.dataDelta.cars[n].wheels[i].pos.y * delta / world.deltaTime;
          mycar.wheels[i].pos.z  =cars[n].wheels[i].pos.z + world.dataDelta.cars[n].wheels[i].pos.z * delta / world.deltaTime;

        } else {
          mycar.wheels[i].pos.x  = cars[n].wheels[i].pos.x;
          mycar.wheels[i].pos.y  = cars[n].wheels[i].pos.y;
          mycar.wheels[i].pos.z =  cars[n].wheels[i].pos.z;
        }


        mycar.wheels[i].quat.x = cars[n].wheels[i].quat.x;
        mycar.wheels[i].quat.y = cars[n].wheels[i].quat.y;
        mycar.wheels[i].quat.z = cars[n].wheels[i].quat.z;
        mycar.wheels[i].quat.w = cars[n].wheels[i].quat.w;
          
        this.getObjMat(mycar.wheels[i]);

        if(mycar.wheels[i].pos.x>0)
          UT.MAT4_MULTIPLY(mycar.wheels[i].matrix, UT.MAT4_ROTATE_Y(Math.PI), mycar.wheels[i].matrix);        

            
            const skid = 1.0 - cars[n].wheels[i].skidding;

            if (skid > 0.1) {
                
                const pts = this.findRoadIntersect(this.world.track, UT.VEC3_CREATE(cars[n].wheels[i].pos.x, cars[n].wheels[i].pos.y, cars[n].wheels[i].pos.z));
                if(pts)
                {
                  mycar.addSkidding(pts, cars[n].wheels[i].contactNormal, skid, time);

                  /*
                  if ((time - world.lastScreech) > 0.1) {
                          
                    this.playAudio('screech', skid);
                    world.lastScreech = time;
                  }
                  */
                }
            }
            
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

    if((this.world.lastCarData)&&(this.world.lastCarData.cars.length >=this.world.cars.length))
    {
      for(let n=0;n<this.world.cars.length;n++)
      {
        let i = 0;

        while (i < this.world.cars[n].contacts.length) {
            const dt = now - this.world.cars[n].contacts[i].time;
  
            if (this.world.cars[n].contacts[i].object == null) {
  
              this.world.cars[n].contacts[i].object = this.contactPool.newObject(0.1, UT.VEC3_CREATE(0.5,0.1,0.1), 1)
              if(this.world.cars[n].contacts[i].object)
              {
                this.world.cars[n].contacts[i].object.mesh.setPosition(this.world.cars[n].contacts[i].pos.x, this.world.cars[n].contacts[i].pos.y, this.world.cars[n].contacts[i].pos.z);
              }
            }

            if(this.world.cars[n].contacts[i].object == null)
            {
              i++;
              continue;
            }
              
  
            if (dt > 500) {
  
                this.contactPool.disposeObject(this.world.cars[n].contacts[i].object);
                this.world.cars[n].contacts.splice(i, 1);
            }
            else {
                this.world.cars[n].contacts[i].object.mesh.material.diffuse[0] = 1.0;
                this.world.cars[n].contacts[i].object.mesh.material.diffuse[1] = dt / 500.0;
                this.world.cars[n].contacts[i].object.mesh.material.changed = true;
  
                this.world.cars[n].contacts[i].object.mesh.setScale(1.0 - dt /500, 1.0 - dt /500, 1.0 - dt /500);
                /*
                this.world.cars[n].contacts[i].object.mesh.scale[0] = ;
                this.world.cars[n].contacts[i].object.mesh.scale[1] = ;
                this.world.cars[n].contacts[i].object.mesh.scale[2] = ;
                */
                i++;
            }
        }



        i = 0;
        while (i < this.world.cars[n].skidPlanes.length) {
            const dt = now - this.world.cars[n].skidPlanes[i].time;

            if (this.world.cars[n].skidPlanes[i].object == null) {
        
              /*
                this.world.cars[n].skidPlanes[i].mat = new THREE.MeshBasicMaterial({ map: engine.skidTex });
                this.world.cars[n].skidPlanes[i].geom = engine.skidPlane.clone();
                this.world.cars[n].skidPlanes[i].object =  new THREE.Mesh(this.world.cars[n].skidPlanes[i].geom, this.world.cars[n].skidPlanes[i].mat );
              */
                this.world.cars[n].skidPlanes[i].object = this.skidPool.newObject(1, [1,1,1], this.world.cars[n].skidPlanes[i].skid);

                if(this.world.cars[n].skidPlanes[i].object)
                {
                  /*
                  this.world.cars[n].skidPlanes[i].object.mesh.rotation[0] = Math.atan2(this.world.cars[n].skidPlanes[i].normal.x , this.world.cars[n].skidPlanes[i].normal.y);
                  this.world.cars[n].skidPlanes[i].object.mesh.rotation[1] = Math.acos(this.world.cars[n].skidPlanes[i].normal.z);
                  */
                  
                  this.world.cars[n].skidPlanes[i].object.mesh.setRotation(Math.atan2(this.world.cars[n].skidPlanes[i].normal.x , this.world.cars[n].skidPlanes[i].normal.y), Math.acos(this.world.cars[n].skidPlanes[i].normal.z), 0);
                  this.world.cars[n].skidPlanes[i].object.mesh.setPosition(this.world.cars[n].skidPlanes[i].pos[0], this.world.cars[n].skidPlanes[i].pos[1], this.world.cars[n].skidPlanes[i].pos[2])
                  //this.world.cars[n].skidPlanes[i].object.mesh.lookAt(this.world.cars[n].skidPlanes[i].normal.x, this.world.cars[n].skidPlanes[i].normal.y, this.world.cars[n].skidPlanes[i].normal.z);
                  //UT.VEC3_SET(this.world.cars[n].skidPlanes[i].object.mesh.position, this.world.cars[n].skidPlanes[i].pos[0], this.world.cars[n].skidPlanes[i].pos[1], this.world.cars[n].skidPlanes[i].pos[2]);
                }
            }
            

            if(this.world.cars[n].skidPlanes[i].object == null)
            {
              i++;
              continue;
            }

            if (dt > 5000) {
                this.skidPool.disposeObject(this.world.cars[n].skidPlanes[i].object);
                this.world.cars[n].skidPlanes.splice(n, 1);
            } else {
                i++;
            }
        }

        
        if (this.world.lastCarData.cars[n].nextNitro > 3000) {
          const d = (5000 - this.world.lastCarData.cars[n].nextNitro) / 2000;

          let nitro = {};

          nitro.obj = this.nitroPool.newObject((d + 1.0) / 3, [0.5,0.5,0.5], 1);

          nitro.obj.mesh.setScale(nitro.obj.mesh.scale[0], nitro.obj.mesh.scale[1], nitro.obj.mesh.scale[2]);

          const p = UT.VEC3_ADD(InPlace.QUAT_MULTIPLY_BY_VEC3([this.world.cars[n].quat.x,this.world.cars[n].quat.y, this.world.cars[n].quat.z, this.world.cars[n].quat.w], UT.VEC3_CREATE(0, 0, -2.8)), [this.world.cars[n].pos.x,this.world.cars[n].pos.y,this.world.cars[n].pos.z]);
          nitro.obj.mesh.setPosition(p[0], p[1], p[2]);

          nitro.start = now;
          
          this.world.cars[n].nitroSpheres.push(nitro);
          
        }

        
        i = 0;

        while (i < this.world.cars[n].nitroSpheres.length) {
            const nitro = this.world.cars[n].nitroSpheres[i];
            const mdt = now - nitro.start;

            if (mdt > 200) {
                
                this.nitroPool.disposeObject(nitro.obj);
                this.world.cars[n].nitroSpheres.splice(i, 1);
            }
            else {
              
                //nitro.obj.mesh.material.opacity = 1.0 - mdt *0.005;
                nitro.obj.mesh.material.diffuse[0] = Math.max(0.5, 1.0 - mdt * 0.05);
                nitro.obj.mesh.material.changed=true;

                nitro.obj.mesh.setScale(1.0 - mdt * 0.005, 1.0 - mdt * 0.005, 1.0 - mdt * 0.005);
                nitro.obj.mesh.translate(0, ts * 0.0108, 0);
              
                i++;
            }

        }
        

      }
    }

    if (this.world.myCar) {

      if ((this.world.myCar.nextNitro > 3000)&&(this.pressed['nitro'])) {

        this.nitros[1].animations[0].frames[0].width = 0;
        this.nitros[2].animations[0].frames[0].width = this.nitros[2].width * (5000 - this.world.myCar.nextNitro) / 2000;

      }else{

        const ratio = Math.max(this.world.myCar.nextNitro / 5000.0 ,0);
        this.nitros[1].animations[0].frames[0].width = this.nitros[1].width * ratio;
        this.nitros[1].animations[0].frames[0].x = this.nitros[1].width * (1.0 -ratio) * 0.5;
        this.nitros[1].position[0] = -250 + this.nitros[1].width * (1.0 -ratio)* 0.5;

        this.nitros[2].animations[0].frames[0].width = 0;
      }

      this.rpm[1].animations[0].frames[0].width = this.rpm[1].width * this.world.myCar.RPM / 8000.0;
      this.dmg[1].animations[0].frames[0].height = this.dmg[1].height *  this.world.myCar.damage / this.world.myCar.carDef.maxdmg;
     
      this.updateCars(this.world, now);

      //gfx3MeshRenderer.enableShadowSource(UT.VEC3_CREATE(0,20,10), UT.VEC3_CREATE(this.world.myCar.pos.x, this.world.myCar.pos.y, this.world.myCar.pos.z));
    
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
    }else{
      //gfx3MeshRenderer.enableShadowSource(UT.VEC3_CREATE(0,20,10), UT.VEC3_CREATE(0, 0, 0));
    }
    
    if (this.roadObj)
      this.roadObj.update(ts);

    if (this.roadWall)
      this.roadWall.update(ts);

    if(this.skySphere)
    {
      this.skySphere.setPosition(this.camera.position[0], this.camera.position[1], this.camera.position[2]);
      this.skySphere.update(ts);
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

    /*
    if(this.mode == 0)
    {

      if(track.wallMesh)
      {
        for (const obj of track.wallMesh) {
          obj[1].draw();
        }  
      }
    }else{*/
      for(let wall of track.walls)
      {
         for (const obj of track.wallObject) {
          gfx3MeshRenderer.drawMesh(obj[1], wall.matrix);
         }
      }
    //}

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
        gfx3MeshRenderer.drawMesh(obj[1], track.jumpers[n].matrix);
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
        InPlace.MAT4_TRANSFORM(p,a,s,track.turrets[n].shots[i].matrix)

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


    this.rpm[0].draw();
    this.rpm[1].draw();

    this.nitros[0].draw();
    this.nitros[1].draw();
    this.nitros[2].draw();

    this.dmg[0].draw();
    this.dmg[1].draw();
  }

  draw() {

    gfx3MeshRenderer.enableDirLight(this.lightDir);

    gfx3MeshRenderer.dirLightColor= UT.VEC4_CREATE(0.6, 0,  0.6, 0.0);
    gfx3MeshRenderer.pointLight0Color= UT.VEC4_CREATE(0.8, 0.8, 0.00, 10.0);
    gfx3MeshRenderer.pointLight1Color= UT.VEC4_CREATE(0.8, 0.8, 0.00, 10.0);

    //document.getElementById('mode').innerHTML =this.mode;
    document.getElementById('time').innerHTML =parseInt(gfx3Manager.lastRenderTime);
    document.getElementById('fps').innerHTML = (1000 / (gfx3Manager.lastRenderTime)).toFixed(2);

    if(this.skySphere)
      this.skySphere.draw();
    
    if (this.world.track)
      this.drawTrack(this.world.track);

    let n=0;

    for(let car of this.world.cars){
      
      if (car.ChassisMesh) {
        for (const obj of car.ChassisMesh) {
          gfx3MeshRenderer.drawMesh(obj[1], car.matrix);
        }

        const ofs = InPlace.QUAT_MULTIPLY_BY_VEC3([this.world.myCar.quat.x,this.world.myCar.quat.y,this.world.myCar.quat.z,this.world.myCar.quat.w], UT.VEC3_CREATE(-this.world.myCar.chassisWidth /2, 0, this.world.myCar.chassisLength + 0.2 ));
        const p=UT.VEC3_CREATE(this.world.myCar.pos.x + ofs[0] , this.world.myCar.pos.y + 2, this.world.myCar.pos.z+ ofs[2]);

        gfx3MeshRenderer.enablePointLight(p, 0);
      }

      if (car.tireMesh) {
        for (let w of car.wheels) {
          for (const obj of car.tireMesh) {
            gfx3MeshRenderer.drawMesh(obj[1], w.matrix);
          }
        }
      }
     
      for(let s of car.nitroSpheres)
      {
        s.obj.mesh.draw();
      }

      for(let c of car.contacts)
      {
        if(c.object)
          c.object.mesh.draw();
      }
      for(let p of this.world.cars[n].skidPlanes)
      {
        if(p.object)
          p.object.mesh.draw();
      }
    }

    if(this.world.myCar)
      this.drawText(Math.abs(this.world.myCar.speed).toFixed(0).toString());
    
    if (this.roadObj)
      this.roadObj.draw();

    if (this.roadWall)
      this.roadWall.draw();


    this.drawUI();

  }


  handleKeyUp(e) {


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

export { PlayScreen };
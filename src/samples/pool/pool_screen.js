import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { UT } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { Gfx3Skybox } from '../../lib/gfx3_skybox/gfx3_skybox';
import { gfx3Manager } from '../../lib/gfx3/gfx3_manager';
import { gfx3MeshRenderer } from '../../lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3MeshShapeCylinder } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_cylinder';
import { Gfx3MeshShapeSphere } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_sphere';

import { Gfx3Particles , candle, firework} from '../../lib/gfx3_particules/gfx3_particles';
import { gfx3ParticlesRenderer } from '../../lib/gfx3_particules/gfx3_particles_renderer';
import { Gfx3MeshPool } from './gfx3_mesh_pool';

// ---------------------------------------------------------------------------------------
const CAMERA_SPEED = 0.1;

class PoolScreen extends Screen {
  constructor() {
    super();


    this.camera = new Gfx3Camera(0);
    this.skybox = new Gfx3Skybox();

    this.camera.setPosition(0,40,80);

    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];

    this.camera_fov = 100;

    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleMouseUpCb = this.handleMouseUp.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);

    this.handleKeyDownCb = this.handleKeyDown.bind(this);
    this.handleKeyUpCb = this.handleKeyUp.bind(this);

    gfx3Manager.views[0].setPerspectiveFar(700);
    gfx3Manager.views[0].setPerspectiveNear(0.1);

    /*
    gfx3Manager.views[0].setShadowSourceProj(600, 200);
    gfx3Manager.enableShadowPass = true;
    */

    this.lightDir = UT.VEC3_CREATE(0, -1, 0.2);
    this.lightPoint1 = UT.VEC3_CREATE(0, -1, 0.2);
    this.lightPoint2 = UT.VEC3_CREATE(0, -1, 0.2);
    this.colFac=0;
  }



  async onEnter() {

    this.texture = await gfx3TextureManager.loadTexture('./samples/pool/color_map.jpg');
    this.normalMap = await gfx3TextureManager.loadTexture('./samples/pool/normal_map_opengl.jpg');
    this.roughnessMap = await gfx3TextureManager.loadTexture('./samples/pool/roughness_map.jpg');

    this.gtexture = await gfx3TextureManager.loadTexture('./samples/pool/ground/color_map.jpg');
    this.gnormalMap = await gfx3TextureManager.loadTexture('./samples/pool/ground/normal_map_opengl.jpg');
    this.groughnessMap = await gfx3TextureManager.loadTexture('./samples/pool/ground/roughness_map.jpg');

    this.skyboxTex = await gfx3TextureManager.loadTexture('./samples/perf/skybox.jpg');
    this.skySphere = new Gfx3MeshShapeSphere(300, 8, 8, UT.VEC2_CREATE(1,1));
    this.skySphere.material.texture = this.skyboxTex;

    this.tests=[];
    const self=this;

    
    this.particles = new Gfx3Particles(UT.VEC3_CREATE(0,18,0), 6.0, 100, candle);
    this.particles.initialize();
    
    this.particles2 = new Gfx3Particles(UT.VEC3_CREATE(0,18,0), 8.0, 100, firework);
    this.particles2.initialize();
    
    setInterval(function(){ self.particles2.initialize(); }, 5000);

    this.ground = new Gfx3MeshShapeCylinder( 100, 1, 4, UT.VEC2_CREATE(1,1));
    this.ground.setPosition(0,-1,0);

    this.ground.material.lightning = true;
    this.ground.material.texture = this.gtexture;
    this.ground.material.normalMap = this.gnormalMap;
    this.ground.material.roughnessMap = this.groughnessMap;
    this.ground.material.envMapEq = this.skyboxTex;
    this.ground.material.changed = true;


    this.obj = new Gfx3MeshShapeCylinder(2,5, 12, UT.VEC2_CREATE(1,1));
    this.obj.material.lightning = true;
    this.obj.material.texture = this.texture;
    this.obj.material.normalMap = this.normalMap;
    this.obj.material.roughnessMap = this.roughnessMap;
    this.obj.material.envMapEq = this.skyboxTex;
    this.obj.material.specular = UT.VEC4_CREATE(1,0,0,32);

    this.obj2 = new Gfx3MeshShapeSphere(2,7,7, UT.VEC2_CREATE(1,1));
    this.obj2.setMaterial(this.obj.material);

    this.pool1 = new Gfx3MeshPool(this.obj , 100);
    this.pool2 = new Gfx3MeshPool(this.obj2, 100);

    this.objs = [];
    this.lastCreate = new Date().getTime();
    this.colFac = 0;
    this.deltaTime = 50;
    this.maxTTL = 8000;
  
    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);

    document.addEventListener('keydown', this.handleKeyDownCb);
    document.addEventListener('keyup', this.handleKeyUpCb);

  }

  onExit() {
    document.removeEventListener('mousedown', this.handleMouseDownCb);
    document.removeEventListener('mouseup', this.handleMouseUpCb);
    document.removeEventListener('mousemove', this.handleMouseMoveCb);

    document.addEventListener('keydown', this.handleKeyDownCb);
    document.addEventListener('keyup', this.handleKeyUpCb);

  }


  

  update(ts) {

    const now = new Date().getTime();

    if((now - this.lastCreate)>this.deltaTime)
    {
      const newObj1 = this.pool1.newObject((Math.sin(this.colFac * 2000) +1.0) +0.5, UT.VEC3_CREATE(1,0,0), 0.8);
      const newObj2 = this.pool2.newObject((Math.sin(this.colFac * 2000) +1.0) +0.5, UT.VEC3_CREATE(1,0,0), 0.8);
      const spd = 3.4;
  
      if(newObj1)
        this.objs.push({time : now, obj:newObj1, pool : 0, v:UT.VEC3_CREATE((Math.random() - 0.5) * spd, -5, (Math.random() - 0.5) * spd )})
      if(newObj2)
        this.objs.push({time : now, obj:newObj2, pool : 1, v:UT.VEC3_CREATE((Math.random() - 0.5) * spd, -5, (Math.random() - 0.5) * spd )})

        this.lastCreate= now;
    }


    this.ground.rotate(0, ts * 0.001,0);
    this.ground.update(ts);


    let i=0;
    while(i<this.objs.length)
    {
      const dt = (now - this.objs[i].time);
      const ratio  = dt / this.maxTTL;
      
      if(dt> this.maxTTL){
        
        if(this.objs[i].pool ==1)
          this.pool2.disposeObject(this.objs[i].obj);
        else
          this.pool1.disposeObject(this.objs[i].obj);

        this.objs.splice(i,1);
      }else{
        this.objs[i].obj.mesh.material.diffuse[0] = (Math.cos((1.0-ratio) * 8.5) + 1.0 ) /2.0;
        this.objs[i].obj.mesh.material.diffuse[1] = 0.5;
        this.objs[i].obj.mesh.material.diffuse[2] = (Math.sin((1.0-ratio) * 8.5) + 1.0 ) /2.0;

        this.objs[i].obj.mesh.material.opacity = 1.0 - ratio;
        this.objs[i].obj.mesh.material.changed = true;

        this.objs[i].obj.mesh.translate(this.objs[i].v[0] * ts * 0.01, this.objs[i].v[1] * ts * 0.01, this.objs[i].v[2] * ts * 0.01);
        this.objs[i].obj.mesh.rotate(ts * 0.001, ts * 0.001, ts * 0.003);

        this.objs[i].obj.mesh.update();

        if(this.objs[i].obj.mesh.position[1]<0)
        {
          if(!this.objs[i].vFlip){
            this.objs[i].v[1] = -this.objs[i].v[1];
            this.objs[i].vFlip = true;
          }
        }else if(this.objs[i].vFlip){
          this.objs[i].vFlip=false;
        }
        this.objs[i].v[1] -= 0.01 * ts;

        i++;
      }
    }

    const m = UT.MAT4_INVERT(this.camera.getCameraMatrix());

    this.objs.sort(function(a,b){

      const v1 = UT.MAT4_MULTIPLY_BY_VEC4(m, a.obj.mesh.position);
      const v2 = UT.MAT4_MULTIPLY_BY_VEC4(m, b.obj.mesh.position);

      if(v1[2]<v2[2])
        return -1;
      else if(v1[2]==v2[2])
        return 0;
      else
        return 1;
    });

    this.skySphere.position[0] = this.camera.position[0];
    this.skySphere.position[1] = this.camera.position[1];
    this.skySphere.position[2] = this.camera.position[2];

    this.skySphere.update(ts);
    this.particles.update(ts);
    this.particles2.update(ts);

    this.colFac += ts * 0.003;

    gfx3MeshRenderer.enableDirLight(this.lightDir);
    gfx3MeshRenderer.dirLightColor[0] = 0.8;
    gfx3MeshRenderer.dirLightColor[1] = 0.8;
    gfx3MeshRenderer.dirLightColor[2] = 0.8;

    this.lightPoint1[0] = Math.cos(this.colFac *0.2)  * 45.0;
    this.lightPoint1[1] = 18;
    this.lightPoint1[2] = Math.cos(this.colFac *0.2)  * 45.0;
    
    gfx3MeshRenderer.enablePointLight(this.lightPoint1, 0);
    gfx3MeshRenderer.pointLight0Color[0] = 0.8;
    gfx3MeshRenderer.pointLight0Color[1] = 0.8;
    gfx3MeshRenderer.pointLight0Color[2] = 0.4;
    gfx3MeshRenderer.pointLight0Color[3] = 0.004;

    this.lightPoint2[0] = Math.sin(this.colFac *0.2 ) * 45.0;
    this.lightPoint2[1] = 18;
    this.lightPoint2[2] = Math.sin(this.colFac *0.2)  * 45.0;
    
    gfx3MeshRenderer.enablePointLight(this.lightPoint2, 1);
    gfx3MeshRenderer.pointLight1Color[0] = 0.8;
    gfx3MeshRenderer.pointLight1Color[1] = 1.0;
    gfx3MeshRenderer.pointLight1Color[2] = 0.8;
    gfx3MeshRenderer.pointLight1Color[3] = 0.004;

    gfx3ParticlesRenderer.pointLight0 = UT.VEC4_CREATE(gfx3MeshRenderer.pointLight0[0],gfx3MeshRenderer.pointLight0[1], gfx3MeshRenderer.pointLight0[2], 1);
    gfx3ParticlesRenderer.pointLight1 = UT.VEC4_CREATE(gfx3MeshRenderer.pointLight1[0],gfx3MeshRenderer.pointLight1[1], gfx3MeshRenderer.pointLight1[2], 1);

    gfx3ParticlesRenderer.pointLight0Color = UT.VEC4_CREATE(gfx3MeshRenderer.pointLight0Color[0],gfx3MeshRenderer.pointLight0Color[1], gfx3MeshRenderer.pointLight0Color[2], gfx3MeshRenderer.pointLight0Color[3]);
    gfx3ParticlesRenderer.pointLight1Color = UT.VEC4_CREATE(gfx3MeshRenderer.pointLight1Color[0],gfx3MeshRenderer.pointLight1Color[1], gfx3MeshRenderer.pointLight0Color[2], gfx3MeshRenderer.pointLight1Color[3]);

  }


  draw() {

  
    //gfx3Manager.views[0].enableShadowSource(this.lightPoint2, UT.VEC3_CREATE(0,0,0));

    this.skySphere.draw();
    this.ground.draw();
    for(let o of this.objs){ o.obj.mesh.draw(); }

    this.particles.draw();
    this.particles2.draw();

    const s = document.getElementById('shadow');
    if(s)s.innerHTML = gfx3Manager.enableShadowPass ? 'yes': 'no';
    document.getElementById('time').innerHTML =parseInt(gfx3Manager.lastRenderTime);
    document.getElementById('fps').innerHTML = (1000 / (gfx3Manager.lastRenderTime)).toFixed(2);

    //this.skybox.draw();
    //gfx3DebugRenderer.drawGrid(UT.MAT4_ROTATE_X(Math.PI * 0.5), 20, 1);
  }


  handleKeyUp(e) {

    if(e.code === 'KeyS')
      gfx3Manager.enableShadowPass ^= 1;
  }

  handleKeyDown(e) {
    
    
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

export { PoolScreen };
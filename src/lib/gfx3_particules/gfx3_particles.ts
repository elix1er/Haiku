import { gfx3ParticlesRenderer } from './gfx3_particles_renderer'

import { UT, Tween, Tween3 } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_particles_shader';


class Particle {
  position: vec3;
  velocity: vec3; // units per second
  acceleration: vec3;

  angle: number;
  angleVelocity: number; // degrees per second
  angleAcceleration: number; // degrees per second, per second

  size: number;

  color: vec3;
  opacity: number;

  age: number;
  alive: number; // use float instead of boolean for shader purposes	

  sizeTween: Tween;
  opacityTween: Tween;
  colorTween: Tween3;

  constructor() {
    this.position = UT.VEC3_CREATE(0, 0, 0);
    this.velocity = UT.VEC3_CREATE(0, 0, 0); // units per second
    this.acceleration = UT.VEC3_CREATE(0, 0, 0);

    this.angle = 0;
    this.angleVelocity = 0; // degrees per second
    this.angleAcceleration = 0; // degrees per second, per second

    this.size = 16.0;

    this.color = UT.VEC3_CREATE(0, 0, 0);
    this.opacity = 1.0;

    this.age = 0;
    this.alive = 0; // use float instead of boolean for shader purposes	

    this.sizeTween = new Tween();
    this.opacityTween = new Tween();
    this.colorTween = new Tween3();

  }

  update(ts: number) {
    UT.VEC3_ADD(this.position, UT.VEC3_SCALE(this.velocity, ts / 1000.0), this.position);
    UT.VEC3_ADD(this.velocity, UT.VEC3_SCALE(this.acceleration, ts / 1000.0), this.velocity);

    // convert from degrees to radians: 0.01745329251 = Math.PI/180
    this.angle += this.angleVelocity * 0.01745329251 * ts / 1000.0;
    this.angleVelocity += this.angleAcceleration * 0.01745329251 * ts / 1000.0;

    this.age += ts / 1000.0;

    // if the tween for a given attribute is nonempty,
    //  then use it to update the attribute's value

    if (this.sizeTween.times.length > 0)
      this.size = this.sizeTween.lerp(this.age);

    if (this.colorTween.times.length > 0) {
      var colorHSL = this.colorTween.lerp(this.age);
      this.color = UT.VEC3_HSL2RGB(colorHSL[0], colorHSL[1], colorHSL[2]);
    }

    if (this.opacityTween.times.length > 0)
      this.opacity = this.opacityTween.lerp(this.age);
  }
}


class Gfx3Particles extends Gfx3Drawable {

  texture: Gfx3Texture | null;

  positionStyle: number;
  positionBase: vec3;
  // cube shape data
  positionSpread: vec3;
  // sphere shape data
  positionRadius: number; // distance from base at which particles start

  velocityStyle: number
  // cube movement data
  velocityBase: vec3;
  velocitySpread: vec3
  // sphere movement data
  //   direction vector calculated using initial position
  speedBase: number;
  speedSpread: number;

  accelerationBase: vec3;
  accelerationSpread: vec3;

  angleBase: number;
  angleSpread: number;
  angleVelocityBase: number;
  angleVelocitySpread: number;
  angleAccelerationBase: number;
  angleAccelerationSpread: number;

  sizeBase: number;
  sizeSpread: number;
  sizeTween: Tween;

  // store colors in HSL format in a THREE.Vector3 object
  // http://en.wikipedia.org/wiki/HSL_and_HSV
  colorBase: vec3;
  colorSpread: vec3;
  colorTween: Tween3;

  opacityBase: number;
  opacitySpread: number;
  opacityTween: Tween;

  //blendStyle = THREE.NormalBlending; // false;

  particleArray: Array<Particle>;

  particleDeathAge: number;

  ////////////////////////
  // EMITTER PROPERTIES //
  ////////////////////////

  emitterAge: number;
  emitterAlive: boolean;
  emitterDeathAge: number; // time (seconds) at which to stop creating particles.

  particleCount: number;

  particlesPerSecond: number;
  particleSize: number;
  particlesPts: Array<vec3>;
  particlesUv: Array<vec2>;
  particlesIdxs: Array<number>;

  constructor(positionBase: vec3, size: number, nParticles: number, parameters: Partial<particles_params>) {
    super(SHADER_VERTEX_ATTR_COUNT);

    this.particleCount = nParticles;
    this.particleSize = size;

    this.particlesPts = [[-this.particleSize, -this.particleSize, 0],
    [-this.particleSize, +this.particleSize, 0],
    [+this.particleSize, -this.particleSize, 0],
    [+this.particleSize, +this.particleSize, 0]];

    this.particlesUv = [[0, 0], [0, 1], [1, 0], [1, 1]];
    this.particlesIdxs = [0, 1, 2, 2, 1, 3];

    this.positionBase = positionBase;
    this.accelerationSpread = UT.VEC3_CREATE(0, 0, 0);
    this.angleAccelerationBase = 0;
    this.angleAccelerationSpread = 0;
    this.opacitySpread = 0.0;
    this.sizeTween = new Tween();

    // store colors in HSL format in a THREE.Vector3 object
    // http://en.wikipedia.org/wiki/HSL_and_HSV

    this.colorTween = new Tween3();
    this.opacityTween = new Tween();

    //this.blendStyle = THREE.NormalBlending; // false;

    this.particleArray = [];


    ////////////////////////
    // EMITTER PROPERTIES //
    ////////////////////////

    this.positionStyle = parameters.positionStyle ? parameters.positionStyle : TYPE_CUBE;
    /* this.positionBase = parameters.positionBase ? parameters.positionBase : this.positionBase */
    this.sizeTween = parameters.sizeTween ? parameters.sizeTween : this.sizeTween
    this.opacityTween = parameters.opacityTween ? parameters.opacityTween : this.opacityTween
    this.colorTween = parameters.colorTween ? parameters.colorTween : this.colorTween

    this.positionRadius = parameters.positionRadius ? parameters.positionRadius : 0.0; // distance from base at which particles start
    this.positionSpread = parameters.positionSpread ? parameters.positionSpread : UT.VEC3_CREATE(0, 0, 0);
    this.velocityStyle = parameters.velocityStyle ? parameters.velocityStyle : TYPE_CUBE;
    this.velocityBase = parameters.velocityBase ? parameters.velocityBase : UT.VEC3_CREATE(0, 0, 0); // cube movement data
    this.velocitySpread = parameters.velocitySpread ? parameters.velocitySpread : UT.VEC3_CREATE(0, 0, 0);
    this.accelerationBase = parameters.accelerationBase ? parameters.accelerationBase : UT.VEC3_CREATE(0, 0, 0);
    this.colorBase = parameters.colorBase ? parameters.colorBase : UT.VEC3_CREATE(0.0, 1.0, 0.5);
    this.colorSpread = parameters.colorSpread ? parameters.colorSpread : UT.VEC3_CREATE(0.0, 0.0, 0.0);
    this.texture = parameters.particleTexture ? parameters.particleTexture : null;
    this.sizeBase = parameters.sizeBase ? parameters.sizeBase : 0.0;
    this.sizeSpread = parameters.sizeSpread ? parameters.sizeSpread : 0.0;
    this.angleBase = parameters.angleBase ? parameters.angleBase : 0.0;
    this.opacityBase = parameters.opacityBase ? parameters.opacityBase : 1.0;
    this.angleSpread = parameters.angleSpread ? parameters.angleSpread : 0.0;
    this.angleVelocityBase = parameters.angleVelocityBase ? parameters.angleVelocityBase : 0.0;
    this.angleVelocitySpread = parameters.angleVelocitySpread ? parameters.angleVelocitySpread : 0.0;

    // sphere movement data
    //   direction vector calculated using initial position

    this.speedBase = parameters.speedBase ? parameters.speedBase : 0.0;
    this.speedSpread = parameters.speedSpread ? parameters.speedSpread : 0.0;

    /*	blendStyle : THREE.AdditiveBlending,  */
    this.particlesPerSecond = parameters.particlesPerSecond ? parameters.particlesPerSecond : 30;
    this.particleDeathAge = parameters.particleDeathAge ? parameters.particleDeathAge : 1.0
    this.emitterDeathAge = parameters.emitterDeathAge ? parameters.emitterDeathAge : 60 // time (seconds) at which to stop creating particles.

    // attach tweens to particles

    // calculate/set derived particle engine values
    this.emitterAge = 0.0;
    this.emitterAlive = true;
  }
  // helper functions for randomization
  randomValue(base: number, spread: number) {
    return base + spread * (Math.random() - 0.5);
  }

  randomVector3(base: vec3, spread: vec3) {
    var rand3 = UT.VEC3_CREATE(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    return UT.VEC3_ADD(base, UT.VEC3_MULTIPLY(spread, rand3));
  }

  createParticle() {
    var particle = new Particle();
    particle.sizeTween = this.sizeTween;
    particle.colorTween = this.colorTween;
    particle.opacityTween = this.opacityTween;

    if (this.positionStyle == TYPE_CUBE)
      particle.position = this.randomVector3(this.positionBase, this.positionSpread);
    if (this.positionStyle == TYPE_SPHERE) {
      var z = 2 * Math.random() - 1;
      var t = 6.2832 * Math.random();
      var r = Math.sqrt(1 - z * z);
      var vec3 = UT.VEC3_CREATE(r * Math.cos(t), r * Math.sin(t), z);
      particle.position = UT.VEC3_ADD(this.positionBase, UT.VEC3_SCALE(vec3, this.positionRadius));
    }
    if (this.velocityStyle == TYPE_CUBE) {
      particle.velocity = this.randomVector3(this.velocityBase, this.velocitySpread);
    }
    if (this.velocityStyle == TYPE_SPHERE) {
      var direction = UT.VEC3_SUBSTRACT(particle.position, this.positionBase);
      var speed = this.randomValue(this.speedBase, this.speedSpread);
      particle.velocity = UT.VEC3_SCALE(UT.VEC3_NORMALIZE(direction), speed);
    }

    particle.acceleration = this.randomVector3(this.accelerationBase, this.accelerationSpread);

    particle.angle = this.randomValue(this.angleBase, this.angleSpread);
    particle.angleVelocity = this.randomValue(this.angleVelocityBase, this.angleVelocitySpread);
    particle.angleAcceleration = this.randomValue(this.angleAccelerationBase, this.angleAccelerationSpread);

    particle.size = this.randomValue(this.sizeBase, this.sizeSpread);

    var color = this.randomVector3(this.colorBase, this.colorSpread);
    particle.color = UT.VEC3_CREATE(color[0], color[1], color[2]);

    particle.opacity = this.randomValue(this.opacityBase, this.opacitySpread);

    particle.age = 0;
    particle.alive = 0; // particles initialize as inactive

    return particle;
  }

  initialize() {
    this.particleArray = [];
    this.emitterAge = 0.0;
    this.emitterAlive = true;

    this.beginVertices(this.particleCount * 6);

    for (let i = 0; i < this.particleCount; i++) {
      this.particleArray[i] = this.createParticle();
      const pos = this.particleArray[i].position;
      const alive = this.particleArray[i].alive;
      const color = UT.VEC3_CREATE(this.particleArray[i].color[0], this.particleArray[i].color[1], this.particleArray[i].color[2]);
      const opacity = this.particleArray[i].opacity;
      const size = this.particleArray[i].size;
      const angle = this.particleArray[i].angle;

      for (let k = 0; k < 6; k++) {
        const v = UT.VEC3_ADD(pos, this.particlesPts[this.particlesIdxs[k]]);
        const uv = this.particlesUv[this.particlesIdxs[k]];
        this.defineVertex(v[0], v[1], v[2], uv[0], uv[1], color[0], color[1], color[2], opacity, size, angle, alive);
      }
    }

    this.endVertices();
  }

  draw(): void {

    gfx3ParticlesRenderer.drawParticles(this);
  }

  update(ts: number) {
    var recycleIndices = [];

    this.beginVertices(this.particleCount * 6);

    // update particle data
    for (var i = 0; i < this.particleCount; i++) {
      if (this.particleArray[i].alive) {
        this.particleArray[i].update(ts);

        // check if particle should expire
        // could also use: death by size<0 or alpha<0.
        if (this.particleArray[i].age > this.particleDeathAge) {
          this.particleArray[i].alive = 0.0;
          recycleIndices.push(i);
        }

        const pos = this.particleArray[i].position;
        const alive = this.particleArray[i].alive;
        const color = UT.VEC3_CREATE(this.particleArray[i].color[0], this.particleArray[i].color[1], this.particleArray[i].color[2]);
        const opacity = this.particleArray[i].opacity;
        const size = this.particleArray[i].size;
        const angle = this.particleArray[i].angle;

        for (let k = 0; k < 6; k++) {
          const v = UT.VEC3_ADD(pos, this.particlesPts[this.particlesIdxs[k]]);
          const uv = this.particlesUv[this.particlesIdxs[k]];
          this.defineVertex(v[0], v[1], v[2], uv[0], uv[1], color[0], color[1], color[2], opacity, size, angle, alive);
        }
      }
    }

    // check if particle emitter is still running
    if (!this.emitterAlive) {
      this.endVertices();
      return;
    }

    // if no particles have died yet, then there are still particles to activate
    if (this.emitterAge < this.particleDeathAge) {
      // determine indices of particles to activate
      var startIndex = Math.round(this.particlesPerSecond * (this.emitterAge + 0));
      var endIndex = Math.round(this.particlesPerSecond * (this.emitterAge + ts / 1000.0));
      if (endIndex > this.particleCount)
        endIndex = this.particleCount;

      for (var i = startIndex; i < endIndex; i++)
        this.particleArray[i].alive = 1.0;
    }

    // if any particles have died while the emitter is still running, we imediately recycle them
    for (var j = 0; j < recycleIndices.length; j++) {
      var i = recycleIndices[j];
      this.particleArray[i] = this.createParticle();
      this.particleArray[i].alive = 1.0; // activate right away

      for (let k = 0; k < 6; k++) {
        const v = UT.VEC3_ADD(this.particleArray[i].position, this.particlesPts[this.particlesIdxs[k]]);

        this.vertices[i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 0] = v[0];
        this.vertices[i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 1] = v[1];
        this.vertices[i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 2] = v[2];
      }
    }
    this.endVertices();

    // stop emitter?
    this.emitterAge += ts / 1000.0;
    if (this.emitterAge > this.emitterDeathAge) this.emitterAlive = false;
  }



  getTransformMatrix() {
    let matrix = UT.MAT4_IDENTITY();
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_Z(this.rotation[2]));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    return new Float32Array(matrix);
  }


  setTexture(texture: Gfx3Texture): void {
    this.texture = texture;
  }

  getTexture(): Gfx3Texture | null {
    return this.texture;
  }
}

export { Gfx3Particles };
import { gfx3ParticlesRenderer } from './gfx3_particles_renderer';
import { gfx3Manager, UniformGroupBitmaps } from '../gfx3/gfx3_manager';
import { UT, TweenNumber, TweenVEC3 } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_particles_shader';

const PARTICULES_UV = [[0, 0], [0, 1], [1, 0], [1, 1]];
const PARTICULES_IDX = [0, 1, 2, 2, 1, 3];
const PARTICULES_PTS: Array<vec3> = [
  [-1, -1, 0],
  [-1, +1, 0],
  [+1, -1, 0],
  [+1, +1, 0]
];

enum VelocityStyle {
  CLASSIC = 'CLASSIC',
  EXPLODE = 'EXPLODE'
};

enum PositionStyle {
  CUBE = 'CUBE',
  SPHERE = 'SPHERE'
};

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
  sizeTween: TweenNumber;
  opacityTween: TweenNumber;
  colorTween: TweenVEC3;

  constructor() {
    this.position = [0, 0, 0];
    this.velocity = [0, 0, 0];
    this.acceleration = [0, 0, 0];
    this.angle = 0;
    this.angleVelocity = 0;
    this.angleAcceleration = 0;
    this.size = 16.0;
    this.color = [0, 0, 0];
    this.opacity = 1.0;
    this.age = 0;
    this.alive = 0;
    this.sizeTween = new TweenNumber();
    this.opacityTween = new TweenNumber();
    this.colorTween = new TweenVEC3();
  }

  update(ts: number) {
    this.position = UT.VEC3_ADD(this.position, UT.VEC3_SCALE(this.velocity, ts / 1000.0));
    this.velocity = UT.VEC3_ADD(this.velocity, UT.VEC3_SCALE(this.acceleration, ts / 1000.0));

    this.angle += this.angleVelocity * UT.DEG_TO_RAD_RATIO * ts / 1000.0;
    this.angleVelocity += this.angleAcceleration * UT.DEG_TO_RAD_RATIO * ts / 1000.0;

    this.age += ts / 1000.0;

    if (!this.sizeTween.isEmpty()) {
      this.size = this.sizeTween.interpolate(this.age);
    }

    if (!this.colorTween.isEmpty()) {
      const colorHSL = this.colorTween.interpolate(this.age);
      this.color = UT.VEC3_HSL2RGB(colorHSL[0], colorHSL[1], colorHSL[2]);
    }

    if (!this.opacityTween.isEmpty()) {
      this.opacity = this.opacityTween.interpolate(this.age);
    }
  }
}

interface ParticlesOptions {
  texture: Gfx3Texture;
  positionStyle: PositionStyle;
  positionBase: vec3;
  positionSpread: vec3;
  positionSphereRadiusBase: number;
  positionRadiusSpread: number;
  velocityStyle: VelocityStyle;
  velocityBase: vec3;
  velocitySpread: vec3;
  velocityExplodeSpeedBase: number;
  velocityExplodeSpeedSpread: number;
  colorBase: vec3;
  colorSpread: vec3;
  colorTween: TweenVEC3;
  sizeBase: number;
  sizeSpread: number;
  sizeTween: TweenNumber;
  opacityBase: number;
  opacitySpread: number;
  opacityTween: TweenNumber;
  accelerationBase: vec3;
  accelerationSpread: vec3;
  angleBase: number;
  angleSpread: number;
  angleVelocityBase: number;
  angleVelocitySpread: number;
  angleAccelerationBase: number;
  angleAccelerationSpread: number;
  particleDeathAge: number;
  particlesPerSecond: number;
  particleCount: number;
  emitterDeathAge: number;
};

class Gfx3Particles extends Gfx3Drawable {
  texture: Gfx3Texture;
  textureBuffer: UniformGroupBitmaps;
  textureChanged: boolean;
  positionStyle: PositionStyle;
  positionBase: vec3;
  positionSpread: vec3;
  positionSphereRadiusBase: number;
  positionRadiusSpread: number;
  velocityStyle: VelocityStyle;
  velocityBase: vec3;
  velocitySpread: vec3;
  velocityExplodeSpeedBase: number;
  velocityExplodeSpeedSpread: number;
  colorBase: vec3;
  colorSpread: vec3;
  colorTween: TweenVEC3;
  sizeBase: number;
  sizeSpread: number;
  sizeTween: TweenNumber;
  opacityBase: number;
  opacitySpread: number;
  opacityTween: TweenNumber;
  accelerationBase: vec3;
  accelerationSpread: vec3;
  angleBase: number;
  angleSpread: number;
  angleVelocityBase: number;
  angleVelocitySpread: number;
  angleAccelerationBase: number;
  angleAccelerationSpread: number;
  particleDeathAge: number;
  particlesPerSecond: number;
  particleCount: number;
  particleArray: Array<Particle>;
  emitterDeathAge: number;
  emitterAge: number;
  emitterAlive: boolean;

  constructor(options: Partial<ParticlesOptions>) {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.texture = options.texture ?? gfx3Manager.createTextureFromBitmap();
    this.textureBuffer = gfx3Manager.createUniformGroupBitmaps('PARTICLES_PIPELINE', 1);
    this.textureBuffer.addSamplerInput(0, this.texture.gpuSampler);
    this.textureBuffer.addTextureInput(1, this.texture.gpuTexture);
    this.textureBuffer.allocate();
    this.textureChanged = false;

    this.positionStyle = options.positionStyle ?? PositionStyle.CUBE;
    this.positionBase = options.positionBase ?? [0, 0, 0];
    this.positionSpread = options.positionSpread ?? [0, 0, 0];
    this.positionSphereRadiusBase = options.positionSphereRadiusBase ?? 0.0;
    this.positionRadiusSpread = options.positionRadiusSpread ?? 0.0;
    this.velocityStyle = options.velocityStyle ?? VelocityStyle.CLASSIC;
    this.velocityBase = options.velocityBase ?? [0, 0, 0];
    this.velocitySpread = options.velocitySpread ?? [0, 0, 0];
    this.velocityExplodeSpeedBase = options.velocityExplodeSpeedBase ?? 0.0;
    this.velocityExplodeSpeedSpread = options.velocityExplodeSpeedSpread ?? 0.0;
    this.colorBase = options.colorBase ?? [0.0, 1.0, 0.5];
    this.colorSpread = options.colorSpread ?? [0.0, 0.0, 0.0];
    this.colorTween = options.colorTween ?? new TweenVEC3();
    this.sizeBase = options.sizeBase ?? 1.0;
    this.sizeSpread = options.sizeSpread ?? 0.0;
    this.sizeTween = options.sizeTween ?? new TweenNumber();
    this.opacityBase = options.opacityBase ?? 1.0;
    this.opacitySpread = options.opacitySpread ?? 0.0;
    this.opacityTween = options.opacityTween ?? new TweenNumber();
    this.accelerationBase = options.accelerationBase ?? [0, 0, 0];
    this.accelerationSpread = options.accelerationSpread ?? [0, 0, 0];
    this.angleBase = options.angleBase ?? 0.0;
    this.angleSpread = options.angleSpread ?? 0.0;
    this.angleVelocityBase = options.angleVelocityBase ?? 0.0;
    this.angleVelocitySpread = options.angleVelocitySpread ?? 0.0;
    this.angleAccelerationBase = options.angleAccelerationBase ?? 0.0;
    this.angleAccelerationSpread = options.angleAccelerationSpread ?? 0.0;
    this.particleDeathAge = options.particleDeathAge ?? 1.0;
    this.particlesPerSecond = options.particlesPerSecond ?? 30;
    this.particleCount = options.particleCount ?? 100;
    this.particleArray = [];
    this.emitterDeathAge = options.emitterDeathAge ?? 60;
    this.emitterAge = 0.0;
    this.emitterAlive = true;

    for (let i = 0; i < this.particleCount; i++) {
      this.particleArray[i] = this.createParticle();
    }
  }

  draw(): void {
    gfx3ParticlesRenderer.drawParticles(this);
  }

  update(ts: number) {
    const recycleIndices = [];

    this.beginVertices(this.particleCount * 6);

    for (let i = 0; i < this.particleCount; i++) {
      if (this.particleArray[i].alive) {
        this.particleArray[i].update(ts);

        if (this.particleArray[i].age > this.particleDeathAge) { // check if particle should expire; could also use: death by size<0 or alpha < 0.
          this.particleArray[i].alive = 0.0;
          recycleIndices.push(i);
        }

        const pos = this.particleArray[i].position;
        const color = this.particleArray[i].color;
        const opacity = this.particleArray[i].opacity;
        const size = this.particleArray[i].size;
        const angle = this.particleArray[i].angle;
        const alive = this.particleArray[i].alive;

        for (let k = 0; k < 6; k++) {
          const v = UT.VEC3_ADD(pos, PARTICULES_PTS[PARTICULES_IDX[k]]);
          const uv = PARTICULES_UV[PARTICULES_IDX[k]];
          this.defineVertex(v[0], v[1], v[2], uv[0], uv[1], color[0], color[1], color[2], opacity, size, angle, alive);
        }
      }
    }

    if (!this.emitterAlive) { // check if particle emitter is still running
      this.endVertices();
      return;
    }

    if (this.emitterAge < this.particleDeathAge) { // if no particles have died yet, then there are still particles to activate
      let startIndex = Math.round(this.particlesPerSecond * (this.emitterAge + 0)); // determine indices of particles to activate
      let endIndex = Math.round(this.particlesPerSecond * (this.emitterAge + ts / 1000.0));
      if (endIndex > this.particleCount) {
        endIndex = this.particleCount;
      }

      for (let i = startIndex; i < endIndex; i++) {
        this.particleArray[i].alive = 1.0;
      }
    }

    for (let j = 0; j < recycleIndices.length; j++) { // if any particles have died while the emitter is still running, we imediately recycle them
      const i = recycleIndices[j];
      this.particleArray[i] = this.createParticle();
      this.particleArray[i].alive = 1.0; // activate right away

      for (let k = 0; k < 6; k++) {
        const v = UT.VEC3_ADD(this.particleArray[i].position, PARTICULES_PTS[PARTICULES_IDX[k]]);
        this.vertices[i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 0] = v[0];
        this.vertices[i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 1] = v[1];
        this.vertices[i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 2] = v[2];
      }
    }

    this.endVertices();

    this.emitterAge += ts / 1000.0; 
    if (this.emitterAge > this.emitterDeathAge) { // stop emitter?
      this.emitterAlive = false;
    }
  }

  createParticle(): Particle {
    const particle = new Particle();

    if (this.positionStyle == PositionStyle.CUBE) {
      particle.position = RANDOM_VEC3(this.positionBase, this.positionSpread);
    }
    else if (this.positionStyle == PositionStyle.SPHERE) {
      const positionRadius = RANDOM_VALUE(this.positionSphereRadiusBase, this.positionRadiusSpread);
      const a1 = Math.PI * 2 * Math.random();
      const a2 = Math.PI * 2 * Math.random();
      const r = positionRadius * Math.cos(a1);
      particle.position = UT.VEC3_ADD(this.positionBase, [r * Math.cos(a2), positionRadius * Math.sin(a1), r * Math.sin(a2)]);
    }

    if (this.velocityStyle == VelocityStyle.CLASSIC) {
      particle.velocity = RANDOM_VEC3(this.velocityBase, this.velocitySpread);
    }
    else if (this.velocityStyle == VelocityStyle.EXPLODE) {
      const direction = UT.VEC3_SUBSTRACT(particle.position, this.positionBase);
      const velocitySpeed = RANDOM_VALUE(this.velocityExplodeSpeedBase, this.velocityExplodeSpeedSpread);
      particle.velocity = UT.VEC3_SCALE(UT.VEC3_NORMALIZE(direction), velocitySpeed);
    }

    particle.color = RANDOM_VEC3(this.colorBase, this.colorSpread);
    particle.colorTween = this.colorTween;
    particle.size = RANDOM_VALUE(this.sizeBase, this.sizeSpread);
    particle.sizeTween = this.sizeTween;
    particle.opacity = RANDOM_VALUE(this.opacityBase, this.opacitySpread);
    particle.opacityTween = this.opacityTween;
    particle.acceleration = RANDOM_VEC3(this.accelerationBase, this.accelerationSpread);
    particle.angle = RANDOM_VALUE(this.angleBase, this.angleSpread);
    particle.angleVelocity = RANDOM_VALUE(this.angleVelocityBase, this.angleVelocitySpread);
    particle.angleAcceleration = RANDOM_VALUE(this.angleAccelerationBase, this.angleAccelerationSpread);
    particle.age = 0;
    particle.alive = 0;
    return particle;
  }

  setTexture(texture: Gfx3Texture): void {
    this.texture = texture;
    this.textureChanged = true;
  }

  getTexture(): Gfx3Texture | null {
    return this.texture;
  }

  getTextureBuffer(): UniformGroupBitmaps {
    if (this.textureChanged) {
      this.textureBuffer.setSamplerInput(0, this.texture.gpuSampler);
      this.textureBuffer.setTextureInput(1, this.texture.gpuTexture);
      this.textureBuffer.allocate();
      this.textureChanged = false;
    }

    return this.textureBuffer;
  }
}

export type { ParticlesOptions };
export { VelocityStyle, PositionStyle, Gfx3Particles };

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function RANDOM_VALUE(base: number, spread: number): number {
  return base + spread * (Math.random() - 0.5);
}

function RANDOM_VEC3(base: vec3, spread: vec3): vec3 {
  const rand3 = UT.VEC3_CREATE(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  return UT.VEC3_ADD(base, UT.VEC3_MULTIPLY(spread, rand3));
}
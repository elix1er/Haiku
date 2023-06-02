import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { Tween, Tween3 } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';

const TYPE_CUBE = 0;
const TYPE_SPHERE = 1;

export interface ParticlesParams {
  speedBase: number;
  speedSpread: number;

  positionStyle: number;
  positionBase: vec3;
  positionRadius: number;
  positionSpread: vec3;

  velocityStyle: number;
  velocityBase: vec3;
  velocitySpread: vec3;

  particleTexture: Gfx3Texture;

  sizeBase: number;
  sizeSpread: number;
  sizeTween: Tween;

  opacityTween: Tween;
  colorTween: Tween3;
  angleSpread: number;
  angleVelocityBase: number;
  angleVelocitySpread: number;

  angleBase: number;
  opacityBase: number;

  accelerationBase: vec3;

  colorBase: vec3;
  colorSpread: vec3;

  /* blendStyle : AdditiveBlending */
  particleDeathAge: number;
  emitterDeathAge: number;
  particlesPerSecond: number;
};

export const Fountain: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [0, 5, 0],
  positionSpread: [10, 0, 10],
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, 160, 0],
  velocitySpread: [100, 20, 100],
  accelerationBase: [0, -100, 0],
  particleTexture: await gfx3TextureManager.loadTexture('./textures/star.png'),
  angleBase: 0,
  angleSpread: 180,
  angleVelocityBase: 0,
  angleVelocitySpread: 360 * 4,
  sizeTween: new Tween([0, 1], [1, 20]),
  opacityTween: new Tween([2, 3], [1, 0]),
  colorTween: new Tween3([0.5, 2], [[0, 1, 0.5], [0.8, 1, 0.5]]),
  particlesPerSecond: 200,
  particleDeathAge: 3.0,
  emitterDeathAge: 60
};

export const Fireball: Partial<ParticlesParams> = {
  positionStyle: TYPE_SPHERE,
  positionBase: [0, 50, 0],
  positionRadius: 2,
  velocityStyle: TYPE_SPHERE,
  speedBase: 40,
  speedSpread: 8,
  particleTexture: await gfx3TextureManager.loadTexture('./textures/smokeparticle.png'),
  sizeTween: new Tween([0, 0.1], [1, 150]),
  opacityTween: new Tween([0.7, 1], [1, 0]),
  colorBase: [0.02, 1, 0.4],
  particlesPerSecond: 60,
  particleDeathAge: 1.5,
  emitterDeathAge: 60
};

export const Smoke: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [0, 0, 0],
  positionSpread: [10, 0, 10],
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, 150, 0],
  velocitySpread: [80, 50, 80],
  accelerationBase: [0, -10, 0],
  particleTexture: await gfx3TextureManager.loadTexture('./textures/smokeparticle.png'),
  angleBase: 0,
  angleSpread: 720,
  angleVelocityBase: 0,
  angleVelocitySpread: 720,
  sizeTween: new Tween([0, 1], [32, 128]),
  opacityTween: new Tween([0.8, 2], [0.5, 0]),
  colorTween: new Tween3([0.4, 1], [[0, 0, 0.2], [0, 0, 0.5]]),
  particlesPerSecond: 200,
  particleDeathAge: 2.0,
  emitterDeathAge: 60
};

export const Clouds: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [-100, 100, 0],
  positionSpread: [0, 50, 60],
  velocityStyle: TYPE_CUBE,
  velocityBase: [40, 0, 0],
  velocitySpread: [20, 0, 0],
  particleTexture: await gfx3TextureManager.loadTexture('./textures/smokeparticle.png'),
  sizeBase: 80.0,
  sizeSpread: 100.0,
  colorBase: [0.0, 0.0, 1.0], // H,S,L
  opacityTween: new Tween([0, 1, 4, 5], [0, 1, 1, 0]),
  particlesPerSecond: 50,
  particleDeathAge: 10.0,
  emitterDeathAge: 60
};

export const Snow: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [0, 200, 0],
  positionSpread: [500, 0, 500],
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, -60, 0],
  velocitySpread: [50, 20, 50],
  accelerationBase: [0, -10, 0],
  angleBase: 0,
  angleSpread: 720,
  angleVelocityBase: 0,
  angleVelocitySpread: 60,
  particleTexture: await gfx3TextureManager.loadTexture('./textures/snowflake.png'),
  sizeTween: new Tween([0, 0.25], [1, 10]),
  colorBase: [0.66, 1.0, 0.9], // H,S,L
  opacityTween: new Tween([2, 3], [0.8, 0]),
  particlesPerSecond: 200,
  particleDeathAge: 4.0,
  emitterDeathAge: 60
};

export const Rain: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [0, 200, 0],
  positionSpread: [600, 0, 600],
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, -400, 0],
  velocitySpread: [10, 50, 10],
  accelerationBase: [0, -10, 0],
  particleTexture: await gfx3TextureManager.loadTexture('./textures/raindrop2flip.png'),
  sizeBase: 8.0,
  sizeSpread: 4.0,
  colorBase: [0.66, 1.0, 0.7], // H,S,L
  colorSpread: [0.00, 0.0, 0.2],
  opacityBase: 0.6,
  particlesPerSecond: 1000,
  particleDeathAge: 1.0,
  emitterDeathAge: 60
};

export const Starfield: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [0, 200, 0],
  positionSpread: [600, 400, 600],
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, 0, 0],
  velocitySpread: [0.5, 0.5, 0.5],
  angleBase: 0,
  angleSpread: 720,
  angleVelocityBase: 0,
  angleVelocitySpread: 4,
  particleTexture: await gfx3TextureManager.loadTexture('./textures/spikey.png'),
  sizeBase: 10.0,
  sizeSpread: 2.0,
  colorBase: [0.15, 1.0, 0.9], // H,S,L
  colorSpread: [0.00, 0.0, 0.2],
  opacityBase: 1,
  particlesPerSecond: 20000,
  particleDeathAge: 60.0,
  emitterDeathAge: 0.1
};

export const Fireflies: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [0, 100, 0],
  positionSpread: [400, 200, 400],
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, 0, 0],
  velocitySpread: [60, 20, 60],
  particleTexture: await gfx3TextureManager.loadTexture('./textures/spark.png'),
  sizeBase: 30.0,
  sizeSpread: 2.0,
  opacityTween: new Tween([0.0, 1.0, 1.1, 2.0, 2.1, 3.0, 3.1, 4.0, 4.1, 5.0, 5.1, 6.0, 6.1], [0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2]),
  colorBase: [0.30, 1.0, 0.6], // H,S,L
  colorSpread: [0.3, 0.0, 0.0],
  particlesPerSecond: 20,
  particleDeathAge: 6.1,
  emitterDeathAge: 600
};

export const Startunnel: Partial<ParticlesParams> = {
  positionStyle: TYPE_CUBE,
  positionBase: [0, 0, 0],
  positionSpread: [10, 10, 10],
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, 100, 200],
  velocitySpread: [40, 40, 80],
  angleBase: 0,
  angleSpread: 720,
  angleVelocityBase: 10,
  angleVelocitySpread: 0,
  particleTexture: await gfx3TextureManager.loadTexture('./textures/spikey.png'),
  sizeBase: 4.0,
  sizeSpread: 2.0,
  colorBase: [0.15, 1.0, 0.8], // H,S,L
  opacityBase: 1,
  particlesPerSecond: 500,
  particleDeathAge: 4.0,
  emitterDeathAge: 60
};

export const Firework: Partial<ParticlesParams> = {
  positionStyle: TYPE_SPHERE,
  positionBase: [0, 100, 0],
  positionRadius: 10,
  velocityStyle: TYPE_SPHERE,
  speedBase: 90,
  speedSpread: 10,
  accelerationBase: [0, -80, 0],
  particleTexture: await gfx3TextureManager.loadTexture('./textures/spark.png'),
  sizeTween: new Tween([0.5, 0.7, 1.3], [5, 40, 1]),
  opacityTween: new Tween([0.2, 0.7, 2.5], [0.75, 1, 0]),
  colorTween: new Tween3([0.4, 0.8, 1.0], [[0, 1, 1], [0, 1, 0.6], [0.8, 1, 0.6]]),
  particlesPerSecond: 3000,
  particleDeathAge: 2.5,
  emitterDeathAge: 0.2
};

export const Candle: Partial<ParticlesParams> = {
  positionStyle: TYPE_SPHERE,
  positionBase: [0, 5, 0],
  positionRadius: 2,
  velocityStyle: TYPE_CUBE,
  velocityBase: [0, 30, 0],
  velocitySpread: [20, 0, 20],
  particleTexture: await gfx3TextureManager.loadTexture('./textures/smokeparticle.png'),
  sizeBase: 1,
  sizeSpread: 3,
  sizeTween: new Tween([0, 0.3, 1.2], [20, 150, 1]),
  opacityTween: new Tween([0.9, 1.5], [1, 0]),
  colorTween: new Tween3([0.5, 1.0], [[0.02, 1, 0.5], [0.05, 1, 0]]),
  particleDeathAge: 1.5,
  emitterDeathAge: 600.0
};
import { UT } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_particles_shader';
import { gfx3ParticlesRenderer } from './gfx3_particles_renderer'
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager.js';

const Type_CUBE = 0;
const Type_SPHERE = 1;

interface particles_params {

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
	angleSpread:number;
	angleVelocityBase:number;
	angleVelocitySpread:number;

	angleBase:number;
	opacityBase:number;

	accelerationBase: vec3;

	colorBase:vec3;
	colorSpread:vec3;

	/*		blendStyle : THREE.AdditiveBlending,  */
	particleDeathAge: number;
	emitterDeathAge: number;
	particlesPerSecond: number;
}


class Tween3 {

	times: Array<number>;
	values: Array<vec3>;


	constructor(timeArray: Array<number> = [], valueArray: Array<vec3> = []) {
		this.times = timeArray;
		this.values = valueArray;
	}

	lerp(t: number): vec3 {
		let i = 0;
		let n = this.times.length;
		while (i < n && t > this.times[i])
			i++;
		if (i == 0) return this.values[0];
		if (i == n) return this.values[n - 1];
		let p = (t - this.times[i - 1]) / (this.times[i] - this.times[i - 1]);

		return UT.VEC3_LERP(this.values[i - 1], this.values[i], p);
	}
}

class Tween {

	times: Array<number>;
	values: Array<number>;

	constructor(timeArray: Array<number> = [], valueArray: Array<number> = []) {
		this.times = timeArray;
		this.values = valueArray;
	}

	lerp(t: number): number {
		let i = 0;
		let n = this.times.length;
		while (i < n && t > this.times[i])
			i++;
		if (i == 0) return this.values[0];
		if (i == n) return this.values[n - 1];
		let p = (t - this.times[i - 1]) / (this.times[i] - this.times[i - 1]);
		return this.values[i - 1] + p * (this.values[i] - this.values[i - 1]);
	}
}


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
		UT.VEC3_ADD(this.position, UT.VEC3_SCALE(this.velocity, ts/ 1000.0), this.position);
		UT.VEC3_ADD(this.velocity, UT.VEC3_SCALE(this.acceleration, ts/ 1000.0), this.velocity);

		// convert from degrees to radians: 0.01745329251 = Math.PI/180
		this.angle += this.angleVelocity * 0.01745329251 * ts / 1000.0;
		this.angleVelocity += this.angleAcceleration * 0.01745329251 * ts/ 1000.0;

		this.age += ts/ 1000.0;

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

	particlesPerSecond:number;
	particleSize:number;
	particlesPts:Array<vec3>;
	particlesUv:Array<vec2>;
	particlesIdxs:Array<number>;

	constructor(positionBase: vec3, size: number, nParticles: number,  parameters: Partial<particles_params>) {
		super(SHADER_VERTEX_ATTR_COUNT);
		
		this.particleCount = nParticles;
		this.particleSize = size;

		this.particlesPts= [[-this.particleSize,-this.particleSize,0],
							[-this.particleSize,+this.particleSize,0],
							[+this.particleSize,-this.particleSize,0],
							[+this.particleSize,+this.particleSize,0]];
							
		this.particlesUv= [[0,0],[0,1],[1,0],[1,1]];
		this.particlesIdxs=[0,1,2,2,1,3];

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

		this.positionStyle = parameters.positionStyle? parameters.positionStyle : Type_CUBE;
		/* this.positionBase = parameters.positionBase ? parameters.positionBase : this.positionBase */
		this.sizeTween = parameters.sizeTween ? parameters.sizeTween : this.sizeTween
		this.opacityTween = parameters.opacityTween ? parameters.opacityTween : this.opacityTween
		this.colorTween = parameters.colorTween ? parameters.colorTween : this.colorTween

		this.positionRadius = parameters.positionRadius ? parameters.positionRadius : 0.0; // distance from base at which particles start
		this.positionSpread = parameters.positionSpread ? parameters.positionSpread : UT.VEC3_CREATE(0, 0, 0);
		this.velocityStyle = parameters.velocityStyle ? parameters.velocityStyle : Type_CUBE;
		this.velocityBase = parameters.velocityBase ? parameters.velocityBase : UT.VEC3_CREATE(0, 0, 0); // cube movement data
		this.velocitySpread = parameters.velocitySpread ? parameters.velocitySpread :  UT.VEC3_CREATE(0, 0, 0);
		this.accelerationBase = parameters.accelerationBase ? parameters.accelerationBase :UT.VEC3_CREATE(0, 0, 0);
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

		if (this.positionStyle == Type_CUBE)
			particle.position = this.randomVector3(this.positionBase, this.positionSpread);
		if (this.positionStyle == Type_SPHERE) {
			var z = 2 * Math.random() - 1;
			var t = 6.2832 * Math.random();
			var r = Math.sqrt(1 - z * z);
			var vec3 = UT.VEC3_CREATE(r * Math.cos(t), r * Math.sin(t), z);
			particle.position = UT.VEC3_ADD(this.positionBase, UT.VEC3_SCALE(vec3, this.positionRadius));
		}
		if (this.velocityStyle == Type_CUBE) {
			particle.velocity = this.randomVector3(this.velocityBase, this.velocitySpread);
		}
		if (this.velocityStyle == Type_SPHERE) {
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

			for(let k=0;k<6;k++)
			{
				const v = UT.VEC3_ADD(pos, this.particlesPts[this.particlesIdxs[k]]);
				const uv =this.particlesUv[this.particlesIdxs[k]];
				this.defineVertex(v[0], v[1], v[2], uv[0], uv[1], color[0], color[1], color[2], opacity, size, angle, alive);
			}
		}

		this.endVertices();
	}

	draw(): void {

		gfx3ParticlesRenderer.drawParticles(this);
	}

	update(ts:number)
	{
		var recycleIndices = [];

		this.beginVertices(this.particleCount * 6);

		// update particle data
		for (var i = 0; i < this.particleCount; i++)
		{
			if ( this.particleArray[i].alive )
			{
				this.particleArray[i].update(ts);

				// check if particle should expire
				// could also use: death by size<0 or alpha<0.
				if ( this.particleArray[i].age > this.particleDeathAge ) 
				{
					this.particleArray[i].alive = 0.0;
					recycleIndices.push(i);
				}

				const pos = this.particleArray[i].position;
				const alive = this.particleArray[i].alive;
				const color = UT.VEC3_CREATE(this.particleArray[i].color[0], this.particleArray[i].color[1], this.particleArray[i].color[2]);
				const opacity = this.particleArray[i].opacity;
				const size = this.particleArray[i].size;
				const angle = this.particleArray[i].angle;

				for(let k=0;k<6;k++)
				{
					const v = UT.VEC3_ADD(pos, this.particlesPts[this.particlesIdxs[k]]);
					const uv =this.particlesUv[this.particlesIdxs[k]];
					this.defineVertex(v[0], v[1], v[2], uv[0], uv[1], color[0], color[1], color[2], opacity, size, angle, alive);
				}
			}		
		}

		// check if particle emitter is still running
		if ( !this.emitterAlive ) {
			this.endVertices();
			return;
		}

		// if no particles have died yet, then there are still particles to activate
		if ( this.emitterAge < this.particleDeathAge )
		{
			// determine indices of particles to activate
			var startIndex = Math.round( this.particlesPerSecond * (this.emitterAge +  0) );
			var   endIndex = Math.round( this.particlesPerSecond * (this.emitterAge + ts / 1000.0) );
			if  ( endIndex > this.particleCount ) 
				endIndex = this.particleCount; 
				
			for (var i = startIndex; i < endIndex; i++)
				this.particleArray[i].alive = 1.0;		
		}

		// if any particles have died while the emitter is still running, we imediately recycle them
		for (var j = 0; j < recycleIndices.length; j++)
		{
			var i = recycleIndices[j];
			this.particleArray[i] = this.createParticle();
			this.particleArray[i].alive = 1.0; // activate right away

			for(let k=0;k<6;k++)
			{
				const v = UT.VEC3_ADD(this.particleArray[i].position, this.particlesPts[this.particlesIdxs[k]]);

				this.vertices[ i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 0]= v[0];
				this.vertices[ i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 1]= v[1];
				this.vertices[ i * SHADER_VERTEX_ATTR_COUNT * 6 + SHADER_VERTEX_ATTR_COUNT * k + 2]= v[2];
			}
		}
		this.endVertices();

		// stop emitter?
		this.emitterAge += ts / 1000.0;
		if ( this.emitterAge > this.emitterDeathAge )  this.emitterAlive = false;
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

export const fountain : Partial<particles_params> =
{
	positionStyle    : Type_CUBE,
	positionBase     : UT.VEC3_CREATE( 0,  5, 0 ),
	positionSpread   : UT.VEC3_CREATE( 10, 0, 10 ),
	
	velocityStyle    : Type_CUBE,
	velocityBase     : UT.VEC3_CREATE( 0,  160, 0 ),
	velocitySpread   : UT.VEC3_CREATE( 100, 20, 100 ), 
	accelerationBase : UT.VEC3_CREATE( 0, -100, 0 ),
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/star.png' ),
	angleBase               : 0,
	angleSpread             : 180,
	angleVelocityBase       : 0,
	angleVelocitySpread     : 360 * 4,
	
	sizeTween    : new Tween( [0, 1], [1, 20] ),
	opacityTween : new Tween( [2, 3], [1, 0] ),
	colorTween   : new Tween3( [0.5, 2], [ UT.VEC3_CREATE(0,1,0.5), UT.VEC3_CREATE(0.8, 1, 0.5) ] ),
	particlesPerSecond : 200,
	particleDeathAge   : 3.0,		
	emitterDeathAge    : 60
};
export const fireball :Partial<particles_params>=
{
	positionStyle  : Type_SPHERE,
	positionBase   : UT.VEC3_CREATE( 0, 50, 0 ),
	positionRadius : 2,
			
	velocityStyle : Type_SPHERE,
	speedBase     : 40,
	speedSpread   : 8,
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/smokeparticle.png' ),
	sizeTween    : new Tween( [0, 0.1], [1, 150] ),
	opacityTween : new Tween( [0.7, 1], [1, 0] ),
	colorBase    : UT.VEC3_CREATE(0.02, 1, 0.4),
	// blendStyle   : THREE.AdditiveBlending,  
	
	particlesPerSecond : 60,
	particleDeathAge   : 1.5,		
	emitterDeathAge    : 60
};

export const smoke :Partial<particles_params>=
{
	positionStyle    : Type_CUBE,
	positionBase     : UT.VEC3_CREATE( 0, 0, 0 ),
	positionSpread   : UT.VEC3_CREATE( 10, 0, 10 ),
	velocityStyle    : Type_CUBE,
	velocityBase     : UT.VEC3_CREATE( 0, 150, 0 ),
	velocitySpread   : UT.VEC3_CREATE( 80, 50, 80 ), 
	accelerationBase : UT.VEC3_CREATE( 0,-10,0 ),
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/smokeparticle.png'),
	angleBase               : 0,
	angleSpread             : 720,
	angleVelocityBase       : 0,
	angleVelocitySpread     : 720,
	
	sizeTween    : new Tween( [0, 1], [32, 128] ),
	opacityTween : new Tween( [0.8, 2], [0.5, 0] ),
	colorTween   : new Tween3( [0.4, 1], [ UT.VEC3_CREATE(0,0,0.2), UT.VEC3_CREATE(0, 0, 0.5) ] ),
	particlesPerSecond : 200,
	particleDeathAge   : 2.0,		
	emitterDeathAge    : 60
};
	
export const clouds:Partial<particles_params>=
{
	positionStyle  : Type_CUBE,
	positionBase   : UT.VEC3_CREATE( -100, 100,  0 ),
	positionSpread : UT.VEC3_CREATE(    0,  50, 60 ),
	
	velocityStyle  : Type_CUBE,
	velocityBase   : UT.VEC3_CREATE( 40, 0, 0 ),
	velocitySpread : UT.VEC3_CREATE( 20, 0, 0 ), 
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/smokeparticle.png'),
	sizeBase     : 80.0,
	sizeSpread   : 100.0,
	colorBase    : UT.VEC3_CREATE(0.0, 0.0, 1.0), // H,S,L
	opacityTween : new Tween([0,1,4,5],[0,1,1,0]),
	particlesPerSecond : 50,
	particleDeathAge   : 10.0,		
	emitterDeathAge    : 60
};
	
export const snow :Partial<particles_params>=
{
	positionStyle    : Type_CUBE,
	positionBase     : UT.VEC3_CREATE( 0, 200, 0 ),
	positionSpread   : UT.VEC3_CREATE( 500, 0, 500 ),
	
	velocityStyle    : Type_CUBE,
	velocityBase     : UT.VEC3_CREATE( 0, -60, 0 ),
	velocitySpread   : UT.VEC3_CREATE( 50, 20, 50 ), 
	accelerationBase : UT.VEC3_CREATE( 0, -10,0 ),
	
	angleBase               : 0,
	angleSpread             : 720,
	angleVelocityBase       :  0,
	angleVelocitySpread     : 60,
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/snowflake.png' ),
		
	sizeTween    : new Tween( [0, 0.25], [1, 10] ),
	colorBase   : UT.VEC3_CREATE(0.66, 1.0, 0.9), // H,S,L
	opacityTween : new Tween( [2, 3], [0.8, 0] ),
	particlesPerSecond : 200,
	particleDeathAge   : 4.0,		
	emitterDeathAge    : 60
};

export const rain :Partial<particles_params>=
{
	positionStyle    : Type_CUBE,
	positionBase     : UT.VEC3_CREATE( 0, 200, 0 ),
	positionSpread   : UT.VEC3_CREATE( 600, 0, 600 ),
	velocityStyle    : Type_CUBE,
	velocityBase     : UT.VEC3_CREATE( 0, -400, 0 ),
	velocitySpread   : UT.VEC3_CREATE( 10, 50, 10 ), 
	accelerationBase : UT.VEC3_CREATE( 0, -10,0 ),
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/raindrop2flip.png' ),
	sizeBase    : 8.0,
	sizeSpread  : 4.0,
	colorBase   : UT.VEC3_CREATE(0.66, 1.0, 0.7), // H,S,L
	colorSpread : UT.VEC3_CREATE(0.00, 0.0, 0.2),
	opacityBase : 0.6,
	particlesPerSecond : 1000,
	particleDeathAge   : 1.0,		
	emitterDeathAge    : 60
};
	
export const starfield :Partial<particles_params>=
{
	positionStyle    : Type_CUBE,
	positionBase     : UT.VEC3_CREATE( 0, 200, 0 ),
	positionSpread   : UT.VEC3_CREATE( 600, 400, 600 ),
	velocityStyle    : Type_CUBE,
	velocityBase     : UT.VEC3_CREATE( 0, 0, 0 ),
	velocitySpread   : UT.VEC3_CREATE( 0.5, 0.5, 0.5 ), 
	
	angleBase               : 0,
	angleSpread             : 720,
	angleVelocityBase       : 0,
	angleVelocitySpread     : 4,
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/spikey.png' ),
	
	sizeBase    : 10.0,
	sizeSpread  : 2.0,				
	colorBase   : UT.VEC3_CREATE(0.15, 1.0, 0.9), // H,S,L
	colorSpread : UT.VEC3_CREATE(0.00, 0.0, 0.2),
	opacityBase : 1,
	particlesPerSecond : 20000,
	particleDeathAge   : 60.0,		
	emitterDeathAge    : 0.1
};
export const fireflies :Partial<particles_params>=
{
	positionStyle  : Type_CUBE,
	positionBase   : UT.VEC3_CREATE( 0, 100, 0 ),
	positionSpread : UT.VEC3_CREATE( 400, 200, 400 ),
	velocityStyle  : Type_CUBE,
	velocityBase   : UT.VEC3_CREATE( 0, 0, 0 ),
	velocitySpread : UT.VEC3_CREATE( 60, 20, 60 ), 
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/spark.png' ),
	sizeBase   : 30.0,
	sizeSpread : 2.0,
	opacityTween : new Tween([0.0, 1.0, 1.1, 2.0, 2.1, 3.0, 3.1, 4.0, 4.1, 5.0, 5.1, 6.0, 6.1],
	                         [0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2] ),				
	colorBase   : UT.VEC3_CREATE(0.30, 1.0, 0.6), // H,S,L
	colorSpread : UT.VEC3_CREATE(0.3, 0.0, 0.0),
	particlesPerSecond : 20,
	particleDeathAge   : 6.1,		
	emitterDeathAge    : 600
};

export const startunnel:Partial<particles_params>=
{
	positionStyle  : Type_CUBE,
	positionBase   : UT.VEC3_CREATE( 0, 0, 0 ),
	positionSpread : UT.VEC3_CREATE( 10, 10, 10 ),
	velocityStyle  : Type_CUBE,
	velocityBase   : UT.VEC3_CREATE( 0, 100, 200 ),
	velocitySpread : UT.VEC3_CREATE( 40, 40, 80 ), 
	
	angleBase               : 0,
	angleSpread             : 720,
	angleVelocityBase       : 10,
	angleVelocitySpread     : 0,
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/spikey.png' ),
	sizeBase    : 4.0,
	sizeSpread  : 2.0,				
	colorBase   : UT.VEC3_CREATE(0.15, 1.0, 0.8), // H,S,L
	opacityBase : 1,
	// blendStyle  : THREE.AdditiveBlending,
	particlesPerSecond : 500,
	particleDeathAge   : 4.0,		
	emitterDeathAge    : 60
};
export const firework :Partial<particles_params>=
{
	positionStyle  : Type_SPHERE,
	positionBase   : UT.VEC3_CREATE( 0, 100, 0 ),
	positionRadius : 10,
	
	velocityStyle  : Type_SPHERE,
	speedBase      : 90,
	speedSpread    : 10,
	
	accelerationBase : UT.VEC3_CREATE( 0, -80, 0 ),
	
	particleTexture : await gfx3TextureManager.loadTexture( '/samples/pool/spark.png' ),
	
	sizeTween    : new Tween( [0.5, 0.7, 1.3], [5, 40, 1] ),
	opacityTween : new Tween( [0.2, 0.7, 2.5], [0.75, 1, 0] ),
	colorTween   : new Tween3( [0.4, 0.8, 1.0], [ [0,1,1], [0,1,0.6], [0.8, 1, 0.6] ] ),
	// blendStyle   : THREE.AdditiveBlending,  
	
	particlesPerSecond : 3000,
	particleDeathAge   : 2.5,		
	emitterDeathAge    : 0.2
};
export const candle :Partial<particles_params>=
{
	positionStyle  : Type_SPHERE,
	positionBase   : UT.VEC3_CREATE( 0, 5, 0 ),
	positionRadius : 2,
	
	velocityStyle  : Type_CUBE,
	velocityBase   : UT.VEC3_CREATE(0,30,0),
	velocitySpread : UT.VEC3_CREATE(20,0,20),
	
	particleTexture :  await gfx3TextureManager.loadTexture('/samples/pool/smokeparticle.png' ),
	
	sizeBase     : 1,
	sizeSpread   : 3,
	sizeTween    : new Tween( [0, 0.3, 1.2], [20, 150, 1] ),
	opacityTween : new Tween( [0.9, 1.5], [1, 0] ),
	colorTween   : new Tween3( [0.5, 1.0], [ UT.VEC3_CREATE(0.02, 1, 0.5), UT.VEC3_CREATE(0.05, 1, 0) ] ),
	
	particleDeathAge   : 1.5,		
	emitterDeathAge    : 600.0
};
	

export { Gfx3Particles };
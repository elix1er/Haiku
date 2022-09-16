import { eventManager } from '../core/event_manager.js';
import { gfx3Manager } from '../gfx3/gfx3_manager.js';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';

class JAMFrame {
  constructor() {
    this.vertices = [];
    this.normals = [];
  }
}

class JAMAnimation {
  constructor() {
    this.name = '';
    this.startFrame = 0;
    this.endFrame = 0;
    this.frameDuration = 0;
  }
}

class Gfx3JAM extends Gfx3Drawable {
  constructor() {
    super();
    this.numVertices = 0;
    this.frames = [];
    this.animations = [];
    this.textureCoords = [];    
    this.texture = gfx3TextureManager.getTexture('');
    this.isLooped = true;
    this.currentAnimation = null;
    this.currentFrameIndex = 0;
    this.frameProgress = 0;
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JAM') {
      throw new Error('Gfx3JAM::loadFromFile(): File not valid !');
    }

    this.numVertices = json['NumVertices'];

    this.frames = [];
    for (let obj of json['Frames']) {
      let frame = new JAMFrame();
      frame.vertices = obj['Vertices'];
      frame.normals = obj['Normals'];
      this.frames.push(frame);
    }

    this.animations = [];
    for (let obj of json['Animations']) {
      let animation = new JAMAnimation();
      animation.name = obj['Name'];
      animation.startFrame = parseInt(obj['StartFrame']);
      animation.endFrame = parseInt(obj['EndFrame']);
      animation.frameDuration = parseInt(obj['FrameDuration']);
      this.animations.push(animation);
    }

    this.textureCoords = [];
    for (let textureCoord of json['TextureCoords']) {
      this.textureCoords.push(textureCoord);
    }

    this.currentAnimation = null;
    this.isLooped = true;
    this.currentFrameIndex = 0;
    this.frameProgress = 0;
  }

  update(ts) {
    if (!this.currentAnimation) {
      return;
    }

    let interpolateFactor = this.frameProgress / this.currentAnimation.frameDuration;
    let nextFrameIndex = 0;

    if (this.currentFrameIndex == this.currentAnimation.endFrame) {
      eventManager.emit(this, 'E_FINISHED');
      nextFrameIndex = this.isLooped ? this.currentAnimation.startFrame : this.currentAnimation.endFrame;
    }
    else {
      nextFrameIndex = this.currentFrameIndex + 1;
    }

    this.clearVertices();

    let currentFrame = this.frames[this.currentFrameIndex];
    let nextFrame = this.frames[nextFrameIndex];
    for (let i = 0; i < this.numVertices; i++) {
      let vax = currentFrame.vertices[i * 3 + 0];
      let vay = currentFrame.vertices[i * 3 + 1];
      let vaz = currentFrame.vertices[i * 3 + 2];
      let vbx = nextFrame.vertices[i * 3 + 0];
      let vby = nextFrame.vertices[i * 3 + 1];
      let vbz = nextFrame.vertices[i * 3 + 2];
      let vx = vax + ((vbx - vax) * interpolateFactor);
      let vy = vay + ((vby - vay) * interpolateFactor);
      let vz = vaz + ((vbz - vaz) * interpolateFactor);
      let tx = this.textureCoords[i * 2 + 0];
      let ty = this.textureCoords[i * 2 + 1];
      this.defineVertex(vx, vy, vz, tx, ty);
    }

    this.commitVertices();

    if (interpolateFactor >= 1) {
      this.currentFrameIndex = nextFrameIndex;
      this.frameProgress = 0;
    }
    else {
      this.frameProgress += ts;
    }
  }

  draw() {
    gfx3Manager.drawMesh(this.getModelMatrix(), this.vertexCount, this.vertices, this.texture);
  }

  play(animationName, isLooped = false, preventSameAnimation = false) {
    if (preventSameAnimation && this.currentAnimation && this.currentAnimation.name == animationName) {
      return;
    }

    let animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx3JAM::play: animation not found !');
    }

    this.currentAnimation = animation;
    this.isLooped = isLooped;
    this.currentFrameIndex = animation.startFrame;
    this.frameProgress = 0;
  }

  getTexture() {
    return this.texture;
  }

  setTexture(texture) {
    this.texture = texture;
  }
}

export { Gfx3JAM };
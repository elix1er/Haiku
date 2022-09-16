let { eventManager } = require('../core/event_manager');
let { gfx3Manager } = require('../gfx3/gfx3_manager');
let { gfx3TextureManager } = require('../gfx3/gfx3_texture_manager');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');

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
    this.isLooped = true;
    this.currentAnimation = null;
    this.currentFrameIndex = 0;
    this.frameProgress = 0;
    this.hasNormals = false;

    this.materialID = gfx3Manager.newMaterial([1.0,1.0,1.0,1.0] , null, null);
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

      if(obj['Normals']){
        this.hasNormals = true;
        frame.normals = obj['Normals'];
      }
      else{
        this.hasNormals = false;
        frame.normals = null;
      }
      
      this.frames.push(frame);
    }

    if(this.hasNormals)
      gfx3Manager.enableLightning(this.materialID, true);
    else
      gfx3Manager.enableLightning(this.materialID, false);

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

      if(this.hasNormals)
      {
        let nax = currentFrame.normals[i * 3 + 0];
        let nay = currentFrame.normals[i * 3 + 1];
        let naz = currentFrame.normals[i * 3 + 2];
        let nbx = nextFrame.normals[i * 3 + 0];
        let nby = nextFrame.normals[i * 3 + 1];
        let nbz = nextFrame.normals[i * 3 + 2];

        let nx = nax + ((nbx - nax) * interpolateFactor);
        let ny = nay + ((nby - nay) * interpolateFactor);
        let nz = naz + ((nbz - naz) * interpolateFactor);


        this.defineVertexNormal(vx, vy, vz, tx, ty, nx, ny, nz);
      }
      else{
        this.defineVertex(vx, vy, vz, tx, ty);
      }
    }

    this.commitVertices();

    if(this.bufferOffsetId === 0)
      this.bufferOffsetId = gfx3Manager.getBufferRangeId( this.vertexCount * this.vertSize);

    gfx3Manager.commitBuffer(this.bufferOffsetId, this.vertices);

    if (interpolateFactor >= 1) {
      this.currentFrameIndex = nextFrameIndex;
      this.frameProgress = 0;
    }
    else {
      this.frameProgress += ts;
    }
  }

  draw() {

    gfx3Manager.drawMesh(this);
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

}

module.exports.Gfx3JAM = Gfx3JAM;
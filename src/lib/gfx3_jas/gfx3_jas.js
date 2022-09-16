import { eventManager } from '../core/event_manager.js';
import { gfx3Manager } from '../gfx3/gfx3_manager.js';
import { Utils } from '../core/utils.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';

class JASFrame {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }
}

class JASAnimation {
  constructor() {
    this.name = '';
    this.frames = [];
    this.frameDuration = 0;
  }
}

class Gfx3JAS extends Gfx3Drawable {
  constructor() {
    super();
    this.animations = [];
    this.offset = [0, 0];
    this.pixelsPerUnit = 100;
    this.billboardMode = false;
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = false;
    this.frameProgress = 0;
    this.materialID = gfx3Manager.newMaterial([1.0,1.0,1.0,1.0] , null, null);
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JAS') {
      throw new Error('Gfx3JAS::loadFromFile(): File not valid !');
    }

    this.animations = [];
    for (let obj of json['Animations']) {
      let animation = new JASAnimation();
      animation.name = obj['Name'];
      animation.frameDuration = parseInt(obj['FrameDuration']);

      for (let objFrame of obj['Frames']) {
        let frame = new JASFrame();
        frame.x = objFrame['X'];
        frame.y = objFrame['Y'];
        frame.width = objFrame['Width'];
        frame.height = objFrame['Height'];
        animation.frames.push(frame);
      }

      this.animations.push(animation);
    }

    this.currentAnimation = null;
    this.currentAnimationIndex = 0;
    this.frameProgress = 0;
  }

  update(ts) {
    if (!this.currentAnimation) {
      return;
    }

    let tex =this.getTexture();

    let currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];
    let minX = 0;
    let minY = 0;
    let maxX = currentFrame.width;
    let maxY = currentFrame.height;
    let ux = (currentFrame.x / tex.gpu.width);
    let uy = (currentFrame.y / tex.gpu.height);
    let vx = (currentFrame.x + currentFrame.width) / tex.gpu.width;
    let vy = (currentFrame.y + currentFrame.height) / tex.gpu.height;

    this.clearVertices();
    this.defineVertex(minX, maxY, 0, ux, uy);
    this.defineVertex(minX, minY, 0, ux, vy);
    this.defineVertex(maxX, minY, 0, vx, vy);
    this.defineVertex(maxX, minY, 0, vx, vy);
    this.defineVertex(maxX, maxY, 0, vx, uy);
    this.defineVertex(minX, maxY, 0, ux, uy);
    this.commitVertices();

    if(this.bufferOffsetId === 0)
      this.bufferOffsetId = gfx3Manager.getBufferRangeId( this.vertexCount * this.vertSize);

      gfx3Manager.commitBuffer(this.bufferOffsetId, this.vertices);

    if (this.frameProgress >= this.currentAnimation.frameDuration) {
      if (this.currentAnimationFrameIndex == this.currentAnimation.frames.length - 1) {
        eventManager.emit(this, 'E_FINISHED');
        this.currentAnimationFrameIndex = this.isLooped ? 0 : this.currentAnimation.frames.length - 1;
        this.frameProgress = 0;
      }
      else {
        this.currentAnimationFrameIndex = this.currentAnimationFrameIndex + 1;
        this.frameProgress = 0;
      }
    }
    else {
      this.frameProgress += ts;
    }
  }

  draw() {
    gfx3Manager.drawMesh(this);
  }

  getModelMatrix() {
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    
    if (this.billboardMode) {
      let view = gfx3Manager.getCurrentView();
      let viewMatrix = view.getCameraViewMatrix();
      matrix = Utils.MAT4_MULTIPLY(matrix, view.getCameraMatrix());
      matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(viewMatrix[12], viewMatrix[13], viewMatrix[14]));
    }

    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(this.rotation[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(1 / this.pixelsPerUnit, 1 / this.pixelsPerUnit, 0));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(-this.offset[0], -this.offset[1], 0));
    return matrix;
  }

  play(animationName, isLooped = false, preventSameAnimation = false) {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    let animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx3JAS::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = isLooped;
    this.frameProgress = 0;
  }

  getOffset() {
    return this.offset;
  }

  getOffsetX() {
    return this.offset[0];
  }

  getOffsetY() {
    return this.offset[1];
  }

  setOffset(offsetX, offsetY) {
    this.offset = [offsetX, offsetY];
  }

  getPixelsPerUnit() {
    return this.pixelsPerUnit;
  }

  setPixelsPerUnit(pixelsPerUnit) {
    this.pixelsPerUnit = pixelsPerUnit;
  }

  setBillboardMode(billboardMode) {
    this.billboardMode = billboardMode;
  }

}

export {Gfx3JAS};
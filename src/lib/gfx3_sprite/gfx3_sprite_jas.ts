import { eventManager } from '../core/event_manager.js';
import { Gfx3Sprite } from './gfx3_sprite.js';

interface JASFrame {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface JASAnimation {
  name: string;
  frames: Array<JASFrame>;
  frameDuration: number;
};

class Gfx3SpriteJAS extends Gfx3Sprite {
  animations: Array<JASAnimation>;
  currentAnimation: JASAnimation | null;
  currentAnimationFrameIndex: number;
  looped: boolean;
  frameProgress: number;

  constructor() {
    super();
    this.animations = [];
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.looped = false;
    this.frameProgress = 0;
  }

  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JAS') {
      throw new Error('Gfx3SpriteJAS::loadFromFile(): File not valid !');
    }

    this.animations = [];
    for (const obj of json['Animations']) {
      const animation: JASAnimation = {
        name: obj['Name'],
        frames: [],
        frameDuration: parseInt(obj['FrameDuration'])
      };

      for (const objFrame of obj['Frames']) {
        animation.frames.push({
          x: objFrame['X'],
          y: objFrame['Y'],
          width: objFrame['Width'],
          height: objFrame['Height']
        });
      }

      this.animations.push(animation);
    }

    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.frameProgress = 0;
  }

  update(ts: number): void {
    if (!this.currentAnimation || !this.texture) {
      return;
    }

    const currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];
    const minX = 0;
    const minY = 0;
    const maxX = currentFrame.width;
    const maxY = currentFrame.height;
    const ux = (currentFrame.x / this.texture.gpuTexture.width);
    const uy = (currentFrame.y / this.texture.gpuTexture.height);
    const vx = (currentFrame.x + currentFrame.width) / this.texture.gpuTexture.width;
    const vy = (currentFrame.y + currentFrame.height) / this.texture.gpuTexture.height;
    const fux = this.flip[0] ? 1 - ux : ux;
    const fuy = this.flip[1] ? 1 - uy : uy;
    const fvx = this.flip[0] ? 1 - vx : vx;
    const fvy = this.flip[1] ? 1 - vy : vy;

    this.beginVertices(6);
    this.defineVertex(minX, maxY, 0, fux, fuy);
    this.defineVertex(minX, minY, 0, fux, fvy);
    this.defineVertex(maxX, minY, 0, fvx, fvy);
    this.defineVertex(maxX, minY, 0, fvx, fvy);
    this.defineVertex(maxX, maxY, 0, fvx, fuy);
    this.defineVertex(minX, maxY, 0, fux, fuy);
    this.endVertices();

    if (this.frameProgress >= this.currentAnimation.frameDuration) {
      if (this.currentAnimationFrameIndex == this.currentAnimation.frames.length - 1) {
        eventManager.emit(this, 'E_FINISHED');
        this.currentAnimationFrameIndex = this.looped ? 0 : this.currentAnimation.frames.length - 1;
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

  play(animationName: string, looped: boolean = false, preventSameAnimation: boolean = false): void {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    const animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx3SpriteJAS::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.looped = looped;
    this.frameProgress = 0;
  }

  setOffsetNormalized(offsetXFactor: number, offsetYFactor: number) {
    if (!this.currentAnimation) {
      return;
    }

    const currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];
    if (!currentFrame) {
      return;
    }

    this.offset[0] = currentFrame.width * offsetXFactor;
    this.offset[1] = currentFrame.height * offsetYFactor;
  }
}

export { Gfx3SpriteJAS };
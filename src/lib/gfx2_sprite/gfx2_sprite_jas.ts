import { eventManager } from '../core/event_manager';
import { gfx2Manager } from '../gfx2/gfx2_manager';
import { Gfx2Drawable } from '../gfx2/gfx2_drawable';

interface JASFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface JASAnimation {
  name: string;
  frames: Array<JASFrame>;
  frameDuration: number;
}

class Gfx2SpriteJAS extends Gfx2Drawable {
  animations: Array<JASAnimation>;
  texture: ImageBitmap | HTMLImageElement;
  currentAnimation: JASAnimation | null;
  currentAnimationFrameIndex: number;
  isLooped: boolean;
  frameProgress: number;

  constructor() {
    super();
    this.animations = [];
    this.texture = gfx2Manager.getDefaultTexture();
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = false;
    this.frameProgress = 0;
  }

  getTexture(): ImageBitmap | HTMLImageElement {
    return this.texture;
  }

  setTexture(texture: ImageBitmap): void {
    this.texture = texture;
  }

  update(ts: number): void {
    if (!this.currentAnimation) {
      return;
    }

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

  paint(): void {
    if (!this.currentAnimation) {
      return;
    }

    const ctx = gfx2Manager.getContext();
    const currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];

    ctx.drawImage(
      this.texture,
      currentFrame.x,
      currentFrame.y,
      currentFrame.width,
      currentFrame.height,
      0,
      0,
      currentFrame.width,
      currentFrame.height
    );
  }

  play(animationName: string, isLooped: boolean = false, preventSameAnimation: boolean = false): void {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    const animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx2SpriteJAS::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = isLooped;
    this.frameProgress = 0;
  }

  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

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
}

export { Gfx2SpriteJAS };
import { eventManager } from '../core/event_manager';
import { UIWidget } from '../ui/ui_widget';

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

class UISprite extends UIWidget {
  animations: Array<JASAnimation>;
  currentAnimation: JASAnimation | undefined;
  currentAnimationFrameIndex: number;
  isLooped: boolean;
  timeElapsed: number;

  constructor(options: { className?: string } = {}) {
    super({
      className: options.className ?? 'UISprite'
    });

    this.animations = [];
    this.currentAnimationFrameIndex = 0;
    this.isLooped = false;
    this.timeElapsed = 0;
  }

  update(ts: number): void {
    if (!this.currentAnimation) {
      return;
    }

    const currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];
    this.node.style.backgroundPositionX = -currentFrame.x + 'px';
    this.node.style.backgroundPositionY = -currentFrame.y + 'px';
    this.node.style.width = currentFrame.width + 'px';
    this.node.style.height = currentFrame.height + 'px';

    if (this.timeElapsed >= this.currentAnimation.frameDuration) {
      if (this.currentAnimationFrameIndex == this.currentAnimation.frames.length - 1) {
        eventManager.emit(this, 'E_FINISHED');
        this.currentAnimationFrameIndex = this.isLooped ? 0 : this.currentAnimation.frames.length - 1;
        this.timeElapsed = 0;
      }
      else {
        this.currentAnimationFrameIndex = this.currentAnimationFrameIndex + 1;
        this.timeElapsed = 0;
      }
    }
    else {
      this.timeElapsed += ts;
    }
  }

  async loadTexture(imageFile: string): Promise<void> {
    return new Promise(resolve => {
      const img = new Image();
      img.src = imageFile;
      img.onload = () => {
        this.node.style.backgroundImage = 'url("' + img.src + '")';
        resolve();
      };
    });
  }

  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    this.animations = [];
    for (const obj of json['Animations']) {
      const animation: JASAnimation = { name: obj['Name'], frames: [], frameDuration: parseInt(obj['FrameDuration']) };
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

    this.currentAnimation = undefined;
    this.currentAnimationFrameIndex = 0;
    this.timeElapsed = 0;
  }

  play(animationName: string, isLooped: boolean = false, preventSameAnimation: boolean = false): void {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    const animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('UISprite::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = isLooped;
    this.timeElapsed = 0;
  }
}

export { UISprite };
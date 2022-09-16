import { eventManager } from '../core/event_manager.js';
import { Gfx2Drawable } from '../gfx2/gfx2_drawable.js';
import { gfx2Manager } from '../gfx2/gfx2_manager.js';
import { gfx2TextureManager } from '../gfx2/gfx2_texture_manager.js';

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

class Gfx2JAS extends Gfx2Drawable {
  constructor() {
    super();
    this.animations = [];
    this.texture = gfx2TextureManager.getDefaultTexture();
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = false;
    this.frameProgress = 0;
  }

  getTexture() {
    return this.texture;
  }

  setTexture(texture) {
    this.texture = texture;
  }

  update(ts) {
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

  paint(ts) {
    if (!this.currentAnimation) {
      return;
    }

    let ctx = gfx2Manager.getContext();
    let currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];

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

  play(animationName, isLooped = false, preventSameAnimation = false) {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    let animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx2JAS::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = isLooped;
    this.frameProgress = 0;
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

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
    this.currentAnimationFrameIndex = 0;
    this.frameProgress = 0;
  }
}

export { Gfx2JAS };
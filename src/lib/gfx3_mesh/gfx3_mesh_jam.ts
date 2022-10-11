import { eventManager } from '../core/event_manager';
import { Gfx3Mesh } from './gfx3_mesh';

interface JAMFrame {
  vertices: Array<number>;
  normals: Array<number>;
};

interface JAMAnimation {
  name: String;
  startFrame: number;
  endFrame: number;
  frameDuration: number;
};

class Gfx3MeshJAM extends Gfx3Mesh {
  numVertices: number;
  frames: Array<JAMFrame>;
  animations: Array<JAMAnimation>;
  textureCoords: Array<number>;
  looped: boolean;
  currentAnimation: JAMAnimation | null;
  currentFrameIndex: number;
  frameProgress: number;

  constructor() {
    super();
    this.numVertices = 0;
    this.frames = [];
    this.animations = [];
    this.textureCoords = [];
    this.looped = true;
    this.currentAnimation = null;
    this.currentFrameIndex = 0;
    this.frameProgress = 0;
  }

  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JAM') {
      throw new Error('Gfx3MeshJAM::loadFromFile(): File not valid !');
    }

    this.frames = [];
    for (const obj of json['Frames']) {
      this.frames.push({
        vertices: obj['Vertices'],
        normals: obj['Normals']
      });
    }

    this.animations = [];
    for (const obj of json['Animations']) {
      this.animations.push({
        name: obj['Name'],
        startFrame: parseInt(obj['StartFrame']),
        endFrame: parseInt(obj['EndFrame']),
        frameDuration: parseInt(obj['FrameDuration'])
      });
    }

    this.textureCoords = [];
    for (const textureCoord of json['TextureCoords']) {
      this.textureCoords.push(textureCoord);
    }

    this.numVertices = json['NumVertices'];
    this.currentAnimation = null;
    this.looped = true;
    this.currentFrameIndex = 0;
    this.frameProgress = 0;
  }

  update(ts: number): void {
    if (!this.currentAnimation) {
      return;
    }

    const interpolateFactor = this.frameProgress / this.currentAnimation.frameDuration;
    let nextFrameIndex = 0;

    if (this.currentFrameIndex == this.currentAnimation.endFrame) {
      eventManager.emit(this, 'E_FINISHED');
      nextFrameIndex = this.looped ? this.currentAnimation.startFrame : this.currentAnimation.endFrame;
    }
    else {
      nextFrameIndex = this.currentFrameIndex + 1;
    }

    this.beginVertices(this.numVertices);
    const currentFrame = this.frames[this.currentFrameIndex];
    const nextFrame = this.frames[nextFrameIndex];

    for (let i = 0; i < this.numVertices; i++) {
      const vax = currentFrame.vertices[i * 3 + 0];
      const vay = currentFrame.vertices[i * 3 + 1];
      const vaz = currentFrame.vertices[i * 3 + 2];
      const vbx = nextFrame.vertices[i * 3 + 0];
      const vby = nextFrame.vertices[i * 3 + 1];
      const vbz = nextFrame.vertices[i * 3 + 2];
      const vx = vax + ((vbx - vax) * interpolateFactor);
      const vy = vay + ((vby - vay) * interpolateFactor);
      const vz = vaz + ((vbz - vaz) * interpolateFactor);

      const ux = this.textureCoords[i * 2 + 0];
      const uy = this.textureCoords[i * 2 + 1];

      const nax = currentFrame.normals[i * 3 + 0];
      const nay = currentFrame.normals[i * 3 + 1];
      const naz = currentFrame.normals[i * 3 + 2];
      const nbx = nextFrame.normals[i * 3 + 0];
      const nby = nextFrame.normals[i * 3 + 1];
      const nbz = nextFrame.normals[i * 3 + 2];
      const nx = nax + ((nbx - nax) * interpolateFactor);
      const ny = nay + ((nby - nay) * interpolateFactor);
      const nz = naz + ((nbz - naz) * interpolateFactor);

      this.defineVertex(vx, vy, vz, ux, uy, nx, ny, nz, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }

    this.endVertices();

    if (interpolateFactor >= 1) {
      this.currentFrameIndex = nextFrameIndex;
      this.frameProgress = 0;
    }
    else {
      this.frameProgress += ts;
    }
  }

  play(animationName: string, looped: boolean = false, preventSameAnimation: boolean = false): void {
    if (preventSameAnimation && this.currentAnimation && this.currentAnimation.name == animationName) {
      return;
    }

    const animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx3MeshJAM::play: animation not found !');
    }

    this.currentAnimation = animation;
    this.looped = looped;
    this.currentFrameIndex = animation.startFrame;
    this.frameProgress = 0;
  }
}

export { Gfx3MeshJAM };
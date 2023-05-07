import { eventManager } from '../core/event_manager';
import { Utils } from '../core/utils';
import { Gfx3Mesh } from './gfx3_mesh';

interface JAMFrame {
  vertices: Array<number>;
  normals: Array<number>;
  tangentes: Array<number>;
  binormals: Array<number>;
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
      const frame: JAMFrame = {
        vertices: [],
        normals: [],
        tangentes: [],
        binormals: []
      };

      for (let i = 0; i < json['NumVertices']; i += 3) {
        const v0 = obj['Vertices'].slice((i * 3) + 0, (i * 3) + 3);
        const v1 = obj['Vertices'].slice((i * 3) + 3, (i * 3) + 6);
        const v2 = obj['Vertices'].slice((i * 3) + 6, (i * 3) + 9);

        const uv0 = json['TextureCoords'].slice((i * 2) + 0, (i * 2) + 2);
        const uv1 = json['TextureCoords'].slice((i * 2) + 2, (i * 2) + 4);
        const uv2 = json['TextureCoords'].slice((i * 2) + 4, (i * 2) + 6);

        const n0 = obj['Normals'].slice((i * 3) + 0, (i * 3) + 3);
        const n1 = obj['Normals'].slice((i * 3) + 3, (i * 3) + 6);
        const n2 = obj['Normals'].slice((i * 3) + 6, (i * 3) + 9);

        const deltaPos1 = Utils.VEC3_SUBSTRACT(v1, v0);
        const deltaPos2 = Utils.VEC3_SUBSTRACT(v2, v0);

        const deltaUV1 = Utils.VEC2_SUBSTRACT(uv1, uv0);
        const deltaUV2 = Utils.VEC2_SUBSTRACT(uv2, uv0);

        const r = 1.0 / ((deltaUV1[0] * deltaUV2[1]) - (deltaUV1[1] * deltaUV2[0]));

        const tx = ((deltaPos1[0] * deltaUV2[1]) - (deltaPos2[0] * deltaUV1[1])) * r;
        const ty = ((deltaPos1[1] * deltaUV2[1]) - (deltaPos2[1] * deltaUV1[1])) * r;
        const tz = ((deltaPos1[2] * deltaUV2[1]) - (deltaPos2[2] * deltaUV1[1])) * r;

        const bx = ((deltaPos2[0] * deltaUV1[0]) - (deltaPos1[0] * deltaUV2[0])) * r;
        const by = ((deltaPos2[1] * deltaUV1[0]) - (deltaPos1[1] * deltaUV2[0])) * r;
        const bz = ((deltaPos2[2] * deltaUV1[0]) - (deltaPos1[2] * deltaUV2[0])) * r;

        frame.vertices.push(v0[0], v0[1], v0[2]);
        frame.vertices.push(v1[0], v1[1], v1[2]);
        frame.vertices.push(v2[0], v2[1], v2[2]);

        frame.normals.push(n0[0], n0[1], n0[2]);
        frame.normals.push(n1[0], n1[1], n1[2]);
        frame.normals.push(n2[0], n2[1], n2[2]);

        frame.tangentes.push(tx, ty, tz);
        frame.tangentes.push(tx, ty, tz);
        frame.tangentes.push(tx, ty, tz);

        frame.binormals.push(bx, by, bz);
        frame.binormals.push(bx, by, bz);
        frame.binormals.push(bx, by, bz);
      }

      this.frames.push(frame);
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

      const tax = currentFrame.tangentes[i * 3 + 0];
      const tay = currentFrame.tangentes[i * 3 + 1];
      const taz = currentFrame.tangentes[i * 3 + 2];
      const tbx = nextFrame.tangentes[i * 3 + 0];
      const tby = nextFrame.tangentes[i * 3 + 1];
      const tbz = nextFrame.tangentes[i * 3 + 2];
      const tx = tax + ((tbx - tax) * interpolateFactor);
      const ty = tay + ((tby - tay) * interpolateFactor);
      const tz = taz + ((tbz - taz) * interpolateFactor);

      const bax = currentFrame.binormals[i * 3 + 0];
      const bay = currentFrame.binormals[i * 3 + 1];
      const baz = currentFrame.binormals[i * 3 + 2];
      const bbx = nextFrame.binormals[i * 3 + 0];
      const bby = nextFrame.binormals[i * 3 + 1];
      const bbz = nextFrame.binormals[i * 3 + 2];
      const bx = tax + ((bbx - bax) * interpolateFactor);
      const by = tay + ((bby - bay) * interpolateFactor);
      const bz = taz + ((bbz - baz) * interpolateFactor);

      this.defineVertex(vx, vy, vz, ux, uy, nx, ny, nz, tx, ty, tz, bx, by, bz);
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
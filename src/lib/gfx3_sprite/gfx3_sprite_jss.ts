import { Gfx3Sprite } from './gfx3_sprite';

class Gfx3SpriteJSS extends Gfx3Sprite {
  textureRect: vec4;

  constructor() {
    super();
    this.textureRect = [0, 0, 1, 1];
  }

  update(): void {
    if (!this.texture) {
      return;
    }

    const minX = 0;
    const minY = 0;
    const maxX = this.textureRect[2];
    const maxY = this.textureRect[3];
    const ux = (this.textureRect[0] / this.texture.gpuTexture.width);
    const uy = (this.textureRect[1] / this.texture.gpuTexture.height);
    const vx = (this.textureRect[0] + this.textureRect[2]) / this.texture.gpuTexture.width;
    const vy = (this.textureRect[1] + this.textureRect[3]) / this.texture.gpuTexture.height;
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
  }

  getTextureRect(): vec4 {
    return this.textureRect;
  }

  setTextureRect(left: number, top: number, width: number, height: number): void {
    this.textureRect = [left, top, width, height];
  }

  setOffsetNormalized(offsetXFactor: number, offsetYFactor: number) {
    this.offset[0] = this.textureRect[2] * offsetXFactor;
    this.offset[1] = this.textureRect[3] * offsetYFactor;
  }
}

export { Gfx3SpriteJSS };
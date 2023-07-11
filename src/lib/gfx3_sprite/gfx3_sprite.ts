import { gfx3Manager, UniformGroupBitmaps } from '../gfx3/gfx3_manager';
import { gfx3SpriteRenderer } from './gfx3_sprite_renderer';
import { UT } from '../core/utils.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_sprite_shader';

class Gfx3Sprite extends Gfx3Drawable {
  offset: vec2;
  flip: [boolean, boolean];
  pixelsPerUnit: number;
  billboardMode: boolean;
  texture: Gfx3Texture;
  textureBuffer: UniformGroupBitmaps;
  textureChanged: boolean;

  constructor() {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.offset = [0, 0];
    this.flip = [false, false];
    this.pixelsPerUnit = 100;
    this.billboardMode = false;

    this.texture = gfx3Manager.createTextureFromBitmap();
    this.textureBuffer = gfx3Manager.createUniformGroupBitmaps('SPRITE_PIPELINE', 1);
    this.textureBuffer.addSamplerInput(0, this.texture.gpuSampler);
    this.textureBuffer.addTextureInput(1, this.texture.gpuTexture);
    this.textureBuffer.allocate();
    this.textureChanged = false;
  }

  draw(): void {
    gfx3SpriteRenderer.drawSprite(this);
  }

  getTransformMatrix(): mat4_buf {
    const matrix = UT.MAT4_CREATE();
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]), matrix);
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_Y(this.rotation[1]), matrix);
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_X(this.rotation[0]), matrix); // y -> x -> z
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_Z(this.rotation[2]), matrix);
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]), matrix);
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_SCALE(1 / this.pixelsPerUnit, 1 / this.pixelsPerUnit, 1 / this.pixelsPerUnit), matrix);
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_TRANSLATE(-this.offset[0], -this.offset[1], 0), matrix);
    return matrix;
  }

  getOffset(): vec2 {
    return this.offset;
  }

  getOffsetX(): number {
    return this.offset[0];
  }

  getOffsetY(): number {
    return this.offset[1];
  }

  setOffset(offsetX: number, offsetY: number): void {
    this.offset = [offsetX, offsetY];
  }

  getFlip(): [boolean, boolean] {
    return this.flip;
  }

  setFlipX(x: boolean): void {
    this.flip[0] = x;
  }

  setFlipY(y: boolean): void {
    this.flip[1] = y;
  }

  getPixelsPerUnit(): number {
    return this.pixelsPerUnit;
  }

  setPixelsPerUnit(pixelsPerUnit: number): void {
    this.pixelsPerUnit = pixelsPerUnit;
  }

  getBillboardMode(): boolean {
    return this.billboardMode;
  }

  setBillboardMode(billboardMode: boolean): void {
    this.billboardMode = billboardMode;
  }

  setTexture(texture: Gfx3Texture): void {
    this.texture = texture;
    this.textureChanged = true;
  }

  getTexture(): Gfx3Texture {
    return this.texture;
  }

  getTextureBuffer(): UniformGroupBitmaps {
    if (this.textureChanged) {
      this.textureBuffer.setSamplerInput(0, this.texture.gpuSampler);
      this.textureBuffer.setTextureInput(1, this.texture.gpuTexture);
      this.textureBuffer.allocate();
      this.textureChanged = false;
    }

    return this.textureBuffer;
  }
}

export { Gfx3Sprite };
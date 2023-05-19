import { gfx3Manager } from '../gfx3/gfx3_manager';
import { gfx3SpriteRenderer } from './gfx3_sprite_renderer';
import { UT } from '../core/utils.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_sprite_shader';

class Gfx3Sprite extends Gfx3Drawable {
  texture: Gfx3Texture;
  offset: vec2;
  pixelsPerUnit: number;
  billboardMode: boolean;

  constructor() {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.texture = gfx3Manager.createTextureFromBitmap();
    this.offset = [0, 0];
    this.pixelsPerUnit = 100;
    this.billboardMode = false;
  }

  draw(): void {
    gfx3SpriteRenderer.drawSprite(this);
  }

  getTransformMatrix() {
    let matrix = UT.MAT4_IDENTITY();
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_ROTATE_Z(this.rotation[2]));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_SCALE(1 / this.pixelsPerUnit, 1 / this.pixelsPerUnit, 1 / this.pixelsPerUnit));
    matrix = UT.MAT4_MULTIPLY(matrix, UT.MAT4_TRANSLATE(-this.offset[0], -this.offset[1], 0));
    return matrix;
  }

  setTexture(texture: Gfx3Texture): void {
    this.texture = texture;
  }

  getTexture(): Gfx3Texture {
    return this.texture;
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
}

export { Gfx3Sprite };
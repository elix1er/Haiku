import { gfx2Manager } from './gfx2_manager';

class Gfx2Drawable {
  position: vec2;
  rotation: number;
  offset: vec2;
  visible: boolean;

  constructor() {
    this.position = [0, 0];
    this.rotation = 0;
    this.offset = [0, 0];
    this.visible = true;
  }

  getPosition(): vec2 {
    return this.position;
  }

  getPositionX(): number {
    return this.position[0];
  }

  getPositionY(): number {
    return this.position[1];
  }

  setPosition(x: number, y: number): void {
    this.position[0] = x;
    this.position[1] = y;
  }

  getRotation(): number {
    return this.rotation;
  }

  setRotation(rotation: number): void {
    this.rotation = rotation;
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

  setOffset(x: number, y: number): void {
    this.offset[0] = x;
    this.offset[1] = y;
  }

  isVisible(): boolean {
    return this.visible;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  draw(): void {
    if (!this.visible) {
      return;
    }

    const ctx = gfx2Manager.getContext();

    ctx.save();
    ctx.translate(-this.offset[0], -this.offset[1]);
    ctx.translate(this.position[0], this.position[1]);
    ctx.rotate(this.rotation);
    this.paint();
    ctx.restore();
  }

  update(ts: number): void {
    // virtual method called during update phase !
  }

  paint() {
    // virtual method called during draw phase !
  }
}

export { Gfx2Drawable };
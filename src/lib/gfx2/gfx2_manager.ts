import { Utils } from '../core/utils';

class Gfx2Manager {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cameraTransform: mat3;
  cameraScale: vec2;
  cameraRotation: number;
  cameraPosition: vec2;
  bgColor: vec4;

  constructor() {
    this.canvas = <HTMLCanvasElement>document.getElementById('CANVAS_2D')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.cameraTransform = Utils.MAT3_IDENTITY();
    this.cameraScale = [1, 1];
    this.cameraRotation = 0;
    this.cameraPosition = [0, 0];
    this.bgColor = [0, 0, 0, 0];

    if (!this.ctx) {
      Utils.FAIL('This browser does not support canvas');
      throw new Error('Gfx2Manager::Gfx2Manager: Your browser not support 2D');
    }
  }

  update(ts: number): void {
    if (this.canvas.width != this.canvas.clientWidth || this.canvas.height != this.canvas.clientHeight) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
    }
  }

  beginDrawing(): void {
    this.ctx.restore();
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = `rgba(${this.bgColor[0]}, ${this.bgColor[1]}, ${this.bgColor[2]}, ${this.bgColor[3]})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.transform(this.cameraTransform[0], this.cameraTransform[1], this.cameraTransform[3], this.cameraTransform[4], this.cameraTransform[6], this.cameraTransform[7]);
    this.ctx.scale(this.cameraScale[0], this.cameraScale[1]);
    this.ctx.rotate(this.cameraRotation);
    this.ctx.translate(-this.cameraPosition[0] + this.canvas.width * 0.5, -this.cameraPosition[1] + this.canvas.height * 0.5);
  }

  endDrawing() {}

  moveCamera(x: number, y: number): void {
    this.cameraPosition[0] += x;
    this.cameraPosition[1] += y;
  }

  findCanvasPosFromClientPos(clientX: number, clientY: number): vec2 {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.x;
    const y = clientY - rect.y;
    return [x, y];
  }

  findWorldPosFromClientPos(clientX: number, clientY: number): vec2 {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.x) + this.cameraPosition[0] - this.canvas.width * 0.5;
    const y = (clientY - rect.y) + this.cameraPosition[1] - this.canvas.height * 0.5;
    return [x, y];
  }

  getWidth(): number {
    return this.canvas.clientWidth;
  }

  getHeight(): number {
    return this.canvas.clientHeight;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  setCameraTransform(cameraTransform: mat3): void {
    this.cameraTransform = cameraTransform;
  }

  getCameraTransform(): mat3 {
    return this.cameraTransform;
  }

  setCameraPosition(x: number, y: number): void {
    this.cameraPosition[0] = x;
    this.cameraPosition[1] = y;
  }

  getCameraPosition(): vec2 {
    return this.cameraPosition;
  }

  getCameraPositionX(): number {
    return this.cameraPosition[0];
  }

  getCameraPositionY(): number {
    return this.cameraPosition[1];
  }

  setCameraScale(x: number, y: number): void {
    this.cameraScale[0] = x;
    this.cameraScale[1] = y;
  }

  getCameraScale(): vec2 {
    return this.cameraScale;
  }

  getCameraScaleX(): number {
    return this.cameraScale[0];
  }

  getCameraScaleY(): number {
    return this.cameraScale[1];
  }

  setCameraRotation(cameraRotation: number): void {
    this.cameraRotation = cameraRotation;
  }

  getCameraRotation(): number {
    return this.cameraRotation;
  }

  setBgColor(r: number, g: number, b: number, a: number): void {
    this.bgColor = [r, g, b, a];
  }

  getBgColor(): vec4 {
    return this.bgColor;
  }

  getDefaultTexture(): HTMLImageElement {
    const image = new Image();
    image.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    return image;
  }
}

export { Gfx2Manager };
export const gfx2Manager = new Gfx2Manager();
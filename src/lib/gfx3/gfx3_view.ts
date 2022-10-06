import { Utils } from '../core/utils';

enum ProjectionMode {
  PERSPECTIVE = 'PERSPECTIVE',
  ORTHOGRAPHIC = 'ORTHOGRAPHIC'
};

interface Gfx3Viewport {
  xFactor: number;
  yFactor: number;
  widthFactor: number;
  heightFactor: number;
};

class Gfx3View {
  clipOffset: vec2;
  cameraMatrix: mat4;
  viewport: Gfx3Viewport;
  projectionMode: ProjectionMode;
  perspectiveFovy: number;
  perspectiveNear: number;
  perspectiveFar: number;
  orthographicSize: number;
  orthographicDepth: number;
  bgColor: vec4;

  constructor() {
    this.clipOffset = [0.0, 0.0];
    this.cameraMatrix = Utils.MAT4_IDENTITY();
    this.viewport = { xFactor: 0, yFactor: 0, widthFactor: 1, heightFactor: 1 };
    this.projectionMode = ProjectionMode.PERSPECTIVE;
    this.perspectiveFovy = Math.PI / 4;
    this.perspectiveNear = 2;
    this.perspectiveFar = 2000;
    this.orthographicSize = 1;
    this.orthographicDepth = 700;
    this.bgColor = [0.0, 0.0, 0.0, 0.0];
  }

  getProjectionMatrix(ar: number): mat4 {
    if (this.projectionMode == ProjectionMode.PERSPECTIVE) {
      return Utils.MAT4_PERSPECTIVE(this.perspectiveFovy, ar, this.perspectiveNear, this.perspectiveFar);
    }
    else if (this.projectionMode == ProjectionMode.ORTHOGRAPHIC) {
      return Utils.MAT4_ORTHOGRAPHIC(this.orthographicSize, this.orthographicDepth);
    }

    throw new Error('Gfx3Manager::setView(): ProjectionMode not valid !');
  }

  getPCMatrix(ar: number): mat4 {
    let pcMatrix = Utils.MAT4_IDENTITY();
    pcMatrix = Utils.MAT4_MULTIPLY(pcMatrix, this.getClipMatrix());
    pcMatrix = Utils.MAT4_MULTIPLY(pcMatrix, this.getProjectionMatrix(ar));
    return pcMatrix;
  }

  getVPCMatrix(ar: number): mat4 {
    let vpcMatrix = Utils.MAT4_IDENTITY();
    vpcMatrix = Utils.MAT4_MULTIPLY(vpcMatrix, this.getClipMatrix());
    vpcMatrix = Utils.MAT4_MULTIPLY(vpcMatrix, this.getProjectionMatrix(ar));
    vpcMatrix = Utils.MAT4_MULTIPLY(vpcMatrix, this.getCameraViewMatrix());
    return vpcMatrix;
  }

  getClipOffset(): vec2 {
    return this.clipOffset;
  }

  getClipOffsetX(): number {
    return this.clipOffset[0];
  }

  getClipOffsetY(): number {
    return this.clipOffset[1];
  }

  setClipOffset(x: number, y: number): void {
    this.clipOffset = [x, y];
  }

  getClipMatrix(): mat4 {
    return Utils.MAT4_INVERT(Utils.MAT4_TRANSLATE(this.clipOffset[0], this.clipOffset[1], 0));
  }

  getCameraMatrix(): mat4 {
    return this.cameraMatrix;
  }

  setCameraMatrix(cameraMatrix: mat4): void {
    this.cameraMatrix = cameraMatrix;
  }

  getCameraViewMatrix(): mat4 {
    return Utils.MAT4_INVERT(this.cameraMatrix);
  }

  getCameraPosition(): vec3 {
    return [this.cameraMatrix[12], this.cameraMatrix[13], this.cameraMatrix[14]];
  }

  getViewport(): Gfx3Viewport {
    return this.viewport;
  }

  setViewport(viewport: Gfx3Viewport): void {
    this.viewport = viewport;
  }

  getProjectionMode(): ProjectionMode {
    return this.projectionMode;
  }

  setProjectionMode(projectionMode: ProjectionMode): void {
    this.projectionMode = projectionMode;
  }

  getPerspectiveFovy(): number {
    return this.perspectiveFovy;
  }

  setPerspectiveFovy(perspectiveFovy: number): void {
    this.perspectiveFovy = perspectiveFovy;
  }

  getPerspectiveNear(): number {
    return this.perspectiveNear;
  }

  setPerspectiveNear(perspectiveNear: number): void {
    this.perspectiveNear = perspectiveNear;
  }

  getPerspectiveFar(): number {
    return this.perspectiveFar;
  }

  setPerspectiveFar(perspectiveFar: number): void {
    this.perspectiveFar = perspectiveFar;
  }

  getOrthographicSize(): number {
    return this.orthographicSize;
  }

  setOrthographicSize(orthographicSize: number): void {
    this.orthographicSize = orthographicSize;
  }

  getOrthographicDepth(): number {
    return this.orthographicDepth;
  }

  setOrthographicDepth(orthographicDepth: number): void {
    this.orthographicDepth = orthographicDepth;
  }

  getBgColor(): vec4 {
    return this.bgColor;
  }

  setBgColor(r: number, g: number, b: number, a: number): void {
    this.bgColor = [r, g, b, a];
  }
}

export type { Gfx3Viewport };
export { ProjectionMode, Gfx3View };
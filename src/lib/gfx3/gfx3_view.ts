import { UT } from '../core/utils';

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
  cacheProjectionMatrix: mat4_buf;
  cacheProjectionMatrixChanged: boolean;
  cacheCameraViewMatrix: mat4_buf;
  cacheCameraViewMatrixChanged: boolean;  
  cacheClipMatrix: mat4_buf;
  cacheClipMatrixChanged: boolean;
  cameraMatrix: mat4;
  clipOffset: vec2;
  viewport: Gfx3Viewport;
  projectionMode: ProjectionMode;
  perspectiveFovy: number;
  perspectiveNear: number;
  perspectiveFar: number;
  orthographicSize: number;
  orthographicDepth: number;
  bgColor: vec4;
  screenSize: vec2;

  constructor() {
    this.cacheProjectionMatrix = UT.MAT4_CREATE();
    this.cacheProjectionMatrixChanged = true;
    this.cacheCameraViewMatrix = UT.MAT4_CREATE();
    this.cacheCameraViewMatrixChanged = true;    
    this.cacheClipMatrix = UT.MAT4_CREATE();
    this.cacheClipMatrixChanged = true;
    this.cameraMatrix = UT.MAT4_IDENTITY();
    this.clipOffset = [0.0, 0.0];
    this.viewport = { xFactor: 0, yFactor: 0, widthFactor: 1, heightFactor: 1 };
    this.projectionMode = ProjectionMode.PERSPECTIVE;
    this.perspectiveFovy = Math.PI / 4;
    this.perspectiveNear = 0.1;
    this.perspectiveFar = 2000;
    this.orthographicSize = 1;
    this.orthographicDepth = 700;
    this.bgColor = [0.0, 0.0, 0.0, 0.0];
    this.screenSize = [0, 0];
  }

  getProjectionMatrix(): mat4_buf {
    if (!this.cacheProjectionMatrixChanged) {
      return this.cacheProjectionMatrix;
    }

    if (this.projectionMode == ProjectionMode.PERSPECTIVE) {
      const viewportWidth = this.screenSize[0] * this.viewport.widthFactor;
      const viewportHeight = this.screenSize[1] * this.viewport.heightFactor;
      UT.MAT4_PERSPECTIVE(this.perspectiveFovy, viewportWidth / viewportHeight, this.perspectiveNear, this.perspectiveFar, this.cacheProjectionMatrix);
    }
    else if (this.projectionMode == ProjectionMode.ORTHOGRAPHIC) {
      UT.MAT4_ORTHOGRAPHIC(this.orthographicSize, this.orthographicDepth, this.cacheProjectionMatrix);
    }

    this.cacheProjectionMatrixChanged = false;
    return this.cacheProjectionMatrix;
  }

  getClipMatrix(): mat4_buf {
    if (!this.cacheClipMatrixChanged) {
      return this.cacheClipMatrix;
    }

    UT.MAT4_INVERT(UT.MAT4_TRANSLATE(this.clipOffset[0], this.clipOffset[1], 0), this.cacheClipMatrix);
    this.cacheClipMatrixChanged = false;
    return this.cacheClipMatrix;
  }

  getCameraViewMatrix(): mat4_buf {
    if (!this.cacheCameraViewMatrixChanged) {
      return this.cacheCameraViewMatrix;
    }

    UT.MAT4_INVERT(this.cameraMatrix, this.cacheCameraViewMatrix);
    this.cacheCameraViewMatrixChanged = false;
    return this.cacheCameraViewMatrix;
  }

  getCameraPosition(): vec3 {
    return [
      this.cameraMatrix[12],
      this.cameraMatrix[13],
      this.cameraMatrix[14]
    ];
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
    this.clipOffset[0] = x;
    this.clipOffset[1] = y;
    this.cacheClipMatrixChanged = true;
  }

  getCameraMatrix(): mat4 {
    return this.cameraMatrix;
  }

  setCameraMatrix(cameraMatrix: mat4): void {
    this.cameraMatrix = cameraMatrix;
    this.cacheCameraViewMatrixChanged = true;
  }

  getViewport(): Gfx3Viewport {
    return this.viewport;
  }

  setViewport(viewport: Gfx3Viewport): void {
    this.viewport = viewport;
    this.cacheProjectionMatrixChanged = true;
  }

  getProjectionMode(): ProjectionMode {
    return this.projectionMode;
  }

  setProjectionMode(projectionMode: ProjectionMode): void {
    this.projectionMode = projectionMode;
    this.cacheProjectionMatrixChanged = true;
  }

  getPerspectiveFovy(): number {
    return this.perspectiveFovy;
  }

  setPerspectiveFovy(perspectiveFovy: number): void {
    this.perspectiveFovy = perspectiveFovy;
    this.cacheProjectionMatrixChanged = true;
  }

  getPerspectiveNear(): number {
    return this.perspectiveNear;
  }

  setPerspectiveNear(perspectiveNear: number): void {
    this.perspectiveNear = perspectiveNear;
    this.cacheProjectionMatrixChanged = true;
  }

  getPerspectiveFar(): number {
    return this.perspectiveFar;
  }

  setPerspectiveFar(perspectiveFar: number): void {
    this.perspectiveFar = perspectiveFar;
    this.cacheProjectionMatrixChanged = true;
  }

  getOrthographicSize(): number {
    return this.orthographicSize;
  }

  setOrthographicSize(orthographicSize: number): void {
    this.orthographicSize = orthographicSize;
    this.cacheProjectionMatrixChanged = true;
  }

  getOrthographicDepth(): number {
    return this.orthographicDepth;
  }

  setOrthographicDepth(orthographicDepth: number): void {
    this.orthographicDepth = orthographicDepth;
    this.cacheProjectionMatrixChanged = true;
  }

  getBgColor(): vec4 {
    return this.bgColor;
  }

  setBgColor(r: number, g: number, b: number, a: number): void {
    this.bgColor[0] = r;
    this.bgColor[1] = g;
    this.bgColor[2] = b;
    this.bgColor[3] = a;
  }

  getScreenSize(): vec2 {
    return this.screenSize;
  }

  setScreenSize(width: number, height: number): void {
    this.screenSize[0] = width;
    this.screenSize[1] = height;
    this.cacheProjectionMatrixChanged = true;
  }

  getProjectionClipMatrix(): mat4_buf {
    const matrix = UT.MAT4_CREATE();
    UT.MAT4_MULTIPLY(matrix, this.getClipMatrix(), matrix);
    UT.MAT4_MULTIPLY(matrix, this.getProjectionMatrix(), matrix);
    return matrix;
  }

  getViewProjectionClipMatrix(): mat4_buf {
    const matrix = UT.MAT4_CREATE();
    UT.MAT4_MULTIPLY(matrix, this.getClipMatrix(), matrix);
    UT.MAT4_MULTIPLY(matrix, this.getProjectionMatrix(), matrix);
    UT.MAT4_MULTIPLY(matrix, this.getCameraViewMatrix(), matrix);
    return matrix;
  }

  getScreenPosition(x: number, y: number, z: number): vec2 {
    const matrix = UT.MAT4_IDENTITY();
    UT.MAT4_MULTIPLY(matrix, this.getClipMatrix(), matrix);
    UT.MAT4_MULTIPLY(matrix, this.getProjectionMatrix(), matrix);
    UT.MAT4_MULTIPLY(matrix, this.getCameraViewMatrix(), matrix);

    const pos = UT.MAT4_MULTIPLY_BY_VEC4(matrix, [x, y, z, 1]);
    const viewportClientWidth = (this.screenSize[0] * this.viewport.widthFactor) / window.devicePixelRatio;
    const viewportClientHeight = (this.screenSize[1] * this.viewport.heightFactor) / window.devicePixelRatio;

    pos[0] = pos[0] / pos[3];
    pos[1] = pos[1] / pos[3];
    pos[0] = ((pos[0] + 1.0) * viewportClientWidth) / (2.0);
    pos[1] = viewportClientHeight - ((pos[1] + 1.0) * viewportClientHeight) / (2.0);
    return [pos[0], pos[1]];
  }

  getScreenNormalizedPosition(x: number, y: number, z: number): vec2 {
    const matrix = UT.MAT4_IDENTITY();
    UT.MAT4_MULTIPLY(matrix, this.getClipMatrix(), matrix);
    UT.MAT4_MULTIPLY(matrix, this.getProjectionMatrix(), matrix);
    UT.MAT4_MULTIPLY(matrix, this.getCameraViewMatrix(), matrix);

    const pos = UT.MAT4_MULTIPLY_BY_VEC4(matrix, [x, y, z, 1]);
    return [pos[0] / pos[3], pos[1] / pos[3]];
  }
}

export type { Gfx3Viewport };
export { ProjectionMode, Gfx3View };
import { UT } from '../core/utils';

class Gfx3Transformable {
  position: vec3;
  rotation: vec3;
  scale: vec3;
  cacheMatrix: mat4_buf;
  cacheMatrixChanged: boolean;

  constructor() {
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.cacheMatrix = UT.MAT4_CREATE();
    this.cacheMatrixChanged = true;
  }

  getPosition(): vec3 {
    return this.position;
  }

  getPositionX(): number {
    return this.position[0];
  }

  getPositionY(): number {
    return this.position[1];
  }

  getPositionZ(): number {
    return this.position[2];
  }

  setPosition(x: number, y: number, z: number): void {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this.cacheMatrixChanged = true;
  }

  translate(x: number, y: number, z: number): void {
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
    this.cacheMatrixChanged = true;
  }

  getRotation(): vec3 {
    return this.rotation;
  }

  getRotationX(): number {
    return this.rotation[0];
  }

  getRotationY(): number {
    return this.rotation[1];
  }

  getRotationZ(): number {
    return this.rotation[2];
  }

  setRotation(x: number, y: number, z: number): void {
    this.rotation[0] = x;
    this.rotation[1] = y;
    this.rotation[2] = z;
    this.cacheMatrixChanged = true;
  }

  rotate(x: number, y: number, z: number): void {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
    this.cacheMatrixChanged = true;
  }

  getScale(): vec3 {
    return this.scale;
  }

  getScaleX(): number {
    return this.scale[0];
  }

  getScaleY(): number {
    return this.scale[1];
  }

  getScaleZ(): number {
    return this.scale[2];
  }

  setScale(x: number, y: number, z: number): void {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
    this.cacheMatrixChanged = true;
  }

  zoom(x: number, y: number, z: number): void {
    this.scale[0] += x;
    this.scale[1] += y;
    this.scale[2] += z;
    this.cacheMatrixChanged = true;
  }

  getTransformMatrix(): mat4_buf {
    if (!this.cacheMatrixChanged) {
      return this.cacheMatrix;
    }

    UT.MAT4_IDENTITY(this.cacheMatrix);
    UT.MAT4_TRANSFORM(this.position, this.rotation, this.scale, this.cacheMatrix);
    this.cacheMatrixChanged = false;
    return this.cacheMatrix;
  }

  getLocalAxies(): Array<vec3> {
    const matrix = this.getTransformMatrix();
    return [
      [matrix[0], matrix[1], matrix[2]],
      [matrix[4], matrix[5], matrix[6]],
      [matrix[8], matrix[9], matrix[10]]
    ];
  }
}

export { Gfx3Transformable };
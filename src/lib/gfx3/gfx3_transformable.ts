import { Utils } from '../core/utils';

class Gfx3Transformable {
  position: vec3;
  rotation: vec3;
  scale: vec3;

  constructor() {
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
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
    this.position = [x, y, z];
  }

  move(x: number, y: number, z: number): void {
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
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
    this.rotation = [x, y, z];
  }

  rotate(x: number, y: number, z: number): void {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
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
    this.scale = [x, y, z];
  }

  zoom(x: number, y: number, z: number): void {
    this.scale[0] += x;
    this.scale[1] += y;
    this.scale[2] += z;
  }

  getTransformMatrix(): mat4 {
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(this.rotation[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    return matrix;
  }
}

export { Gfx3Transformable };
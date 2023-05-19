import { gfx3Manager } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3View } from '../gfx3/gfx3_view';
import { Gfx3Transformable } from '../gfx3/gfx3_transformable';

class Gfx3Camera extends Gfx3Transformable {
  view: Gfx3View;

  constructor(viewIndex: number) {
    super();
    this.view = gfx3Manager.getView(viewIndex);
  }

  setPosition(x: number, y: number, z: number): void {
    super.setPosition(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  translate(x: number, y: number, z: number): void {
    super.translate(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  setRotation(x: number, y: number, z: number): void {
    super.setRotation(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  rotate(x: number, y: number, z: number): void {
    super.rotate(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  setScale(x: number, y: number, z: number): void {
    super.setScale(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  zoom(x: number, y: number, z: number): void {
    super.zoom(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  changeView(viewIndex: number): void {
    this.view = gfx3Manager.getView(viewIndex);
  }

  lookAt(x: number, y: number, z:number): void {
    const matrix = this.view.getCameraMatrix();
    UT.MAT4_LOOKAT(this.position, UT.VEC3_CREATE(x, y, z), UT.VEC3_CREATE(0, 1, 0), matrix);
    UT.MAT4_MULTIPLY(matrix, UT.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]), matrix);
    this.view.setCameraMatrix(matrix);
  }

  getCameraMatrix(): mat4 {
    return this.view.getCameraMatrix();
  }

  getLocalAxies(): Array<vec3> {
    const matrix = this.view.getCameraMatrix();
    return [
      UT.VEC3_CREATE(matrix[0], matrix[1], matrix[2]),
      UT.VEC3_CREATE(matrix[4], matrix[5], matrix[6]),
      UT.VEC3_CREATE(matrix[8], matrix[9], matrix[10])
    ];
  }
}

export { Gfx3Camera };
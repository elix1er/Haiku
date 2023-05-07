import { gfx3Manager } from '../gfx3/gfx3_manager';
import { Utils } from '../core/utils';
import { Gfx3View } from '../gfx3/gfx3_view';
import { Gfx3Transformable } from '../gfx3/gfx3_transformable';

class Gfx3Camera extends Gfx3Transformable {
  view: Gfx3View;

  constructor(viewIndex: number) {
    super();
    this.view = gfx3Manager.getView(viewIndex);
  }

  setPosition(x: number, y: number, z: number): void {
    this.position = [x, y, z];
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  translate(x: number, y: number, z: number): void {
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  setRotation(x: number, y: number, z: number): void {
    this.rotation = [x, y, z];
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  rotate(x: number, y: number, z: number): void {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  setScale(x: number, y: number, z: number): void {
    this.scale = [x, y, z];
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  zoom(x: number, y: number, z: number): void {
    this.scale[0] += x;
    this.scale[1] += y;
    this.scale[2] += z;
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  changeView(viewIndex: number): void {
    this.view = gfx3Manager.getView(viewIndex);
  }

  lookAt(x: number, y: number, z:number): void {
    let matrix = Utils.MAT4_LOOKAT(this.position, [x, y, z], [0, 1, 0]);
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    this.view.setCameraMatrix(matrix);
  }

  getCameraMatrix(): mat4 {
    return this.view.getCameraMatrix();
  }

  getLocalAxies(): Array<vec3> {
    const matrix = this.view.getCameraMatrix();
    return [
      [matrix[0], matrix[1], matrix[2]],
      [matrix[4], matrix[5], matrix[6]],
      [matrix[8], matrix[9], matrix[10]]      
    ];
  }
}

export { Gfx3Camera };
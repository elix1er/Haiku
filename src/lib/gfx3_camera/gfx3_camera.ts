import { gfx3Manager } from '../gfx3/gfx3_manager';
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

  move(x: number, y: number, z: number): void {
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
}

export { Gfx3Camera };
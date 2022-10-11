import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';
import { Utils } from '../core/utils.js';
import { Gfx3Transformable } from '../gfx3/gfx3_transformable';
import { Gfx3Mesh } from '../gfx3_mesh/gfx3_mesh';
import { gfx3MeshRenderer } from '../gfx3_mesh/gfx3_mesh_renderer';

class Gfx3MeshGLTFObject extends Gfx3Transformable {
  id: number;
  name: string;
  children: Array<Gfx3MeshGLTFObject>;
  drawables: Array<Gfx3Mesh>;

  constructor(id: number) {
    super();
    this.id = id;
    this.name = 'default';
    this.children = [];
    this.drawables = [];
  }

  delete(): void {
    for (const drawable of this.drawables) {
      drawable.delete();
    }

    for (const child of this.children) {
      child.delete();
    }
  }

  update(ts: number): void {
    for (const child of this.children) {
      child.update(ts);
    }
  }

  draw(parentMat: mat4 | null = null): void {
    const mat = (parentMat == null) ? this.getTransformMatrix() : Utils.MAT4_MULTIPLY(parentMat, this.getTransformMatrix());

    for (const drawable of this.drawables) {
      gfx3MeshRenderer.drawMesh(drawable, mat);
    }

    for (const child of this.children) {
      child.draw(mat);
    }
  }

  addChild(c: Gfx3MeshGLTFObject): void {
    this.children.push(c);
  }

  addDrawable(drawable: Gfx3Mesh): void {
    this.drawables.push(drawable);
  }

  find(id: number): Gfx3MeshGLTFObject | null {
    if (this.id === id) {
      return this;
    }

    for (const child of this.children) {
      const found = child.find(id);
      if (found !== null) {
        return found;
      }
    }

    return null;
  }

  findByName(name: string): Gfx3MeshGLTFObject | null {
    if (this.name === name) {
      return this;
    }

    for (const child of this.children) {
      const found = child.findByName(name);
      if (found !== null) {
        return found;
      }
    }

    return null;
  }

  getTotalBoundingBox(parentMat: mat4 | null = null): Gfx3BoundingBox {
    const m = this.getTransformMatrix();
    const newMat = parentMat ? Utils.MAT4_MULTIPLY(m, parentMat) : m;
    let totalBox = new Gfx3BoundingBox();

    for (const drawable of this.drawables) {
      let drawableBox = drawable.getWorldBoundingBox();
      drawableBox = drawableBox.transform(newMat);
      totalBox = totalBox.merge(drawableBox);
    }

    for (let child of this.children) {
      const childBox = child.getTotalBoundingBox(newMat);
      totalBox = totalBox.merge(childBox);
    }

    return totalBox;
  }

  setName(name: string): void {
    this.name = name;
  }
}

export { Gfx3MeshGLTFObject };
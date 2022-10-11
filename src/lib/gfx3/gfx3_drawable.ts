import { gfx3Manager, VertexSubBuffer } from '../gfx3/gfx3_manager';
import { Gfx3Transformable } from '../gfx3/gfx3_transformable';
import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';

class Gfx3Drawable extends Gfx3Transformable {
  vertexSubBuffer: VertexSubBuffer;
  vertices: Array<number>;
  vertexCount: number;
  vertexStride: number;
  boundingBox: Gfx3BoundingBox;

  constructor(vertexStride: number) {
    super();
    this.vertexSubBuffer = gfx3Manager.createVertexBuffer(0);
    this.vertices = [];
    this.vertexCount = 0;
    this.vertexStride = vertexStride;
    this.boundingBox = new Gfx3BoundingBox();
  }

  update(ts: number): void {
    // virtual method called during update phase !
  }

  delete(): void {
    gfx3Manager.destroyVertexBuffer(this.vertexSubBuffer);
  }

  beginVertices(vertexCount: number): void {
    gfx3Manager.destroyVertexBuffer(this.vertexSubBuffer);
    this.vertexSubBuffer = gfx3Manager.createVertexBuffer(vertexCount * this.vertexStride * 4);
    this.vertices = [];
    this.vertexCount = 0;
    this.boundingBox.reset();
  }

  defineVertex(...v: Array<number>) {
    this.vertices.push(...v);
    this.vertexCount++;
  }

  // defineVertexNormal(x: number, y: number, z: number, uvx: number, uvy: number, nx: number, ny: number, nz: number): void {
  //   this.vertices.push(x, y, z, uvx, uvy, nx, ny, nz, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
  //   this.vertexCount++;
  // }

  // defineVertexTangeant(x: number, y: number, z: number, uvx: number, uvy: number, nx: number, ny: number, nz: number, tx: number, ty: number, tz: number, bx: number, by: number, bz: number): void {
  //   this.vertices.push(x, y, z, uvx, uvy, nx, ny, nz, tx, ty, tz, bx, by, bz);
  //   this.vertexCount++;
  // }

  // defineVertex(x: number, y: number, z: number, uvx: number, uvy: number): void {
  //   this.vertices.push(x, y, z, uvx, uvy, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
  //   this.vertexCount++;
  // }

  endVertices(): void {
    gfx3Manager.writeVertexBuffer(this.vertexSubBuffer, this.vertices);
    this.boundingBox = Gfx3BoundingBox.createFromVertices(this.vertices, this.vertexStride);
  }

  getVertexSubBufferOffset(): number {
    return this.vertexSubBuffer.offset;
  }

  getVertexSubBufferSize(): number {
    return this.vertexSubBuffer.vertices.byteLength;
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  getWorldBoundingBox(): Gfx3BoundingBox {
    return this.boundingBox.transform(this.getTransformMatrix());
  }
}

export { Gfx3Drawable };
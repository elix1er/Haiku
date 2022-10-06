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
    this.vertexCount = vertexCount;
    this.boundingBox.reset();
  }

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
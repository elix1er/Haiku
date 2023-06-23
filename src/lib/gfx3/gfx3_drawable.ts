import { gfx3Manager, VertexSubBuffer } from './gfx3_manager';
import { Gfx3Transformable } from './gfx3_transformable';
import { Gfx3BoundingBox } from './gfx3_bounding_box';

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

  defineVertex(...v: Array<number>) {
    this.vertices.push(...v);
  }

  setVertices(vertices: Array<number>) {
    this.vertices = vertices;
  }

  endVertices(): void {
    gfx3Manager.writeVertexBuffer(this.vertexSubBuffer, this.vertices);
    this.boundingBox.fromVertices(this.vertices, this.vertexStride);
  }

  getVertexSubBufferOffset(): number {
    return this.vertexSubBuffer.offset;
  }

  getVertexSubBufferSize(): number {
    return this.vertexSubBuffer.vertices.byteLength;
  }

  getVertices(): Array<number> {
    return this.vertices;
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  getBoundingBox(): Gfx3BoundingBox {
    return this.boundingBox;
  }

  getWorldBoundingBox(): Gfx3BoundingBox {
    return this.boundingBox.transform(this.getTransformMatrix());
  }
}

export { Gfx3Drawable };
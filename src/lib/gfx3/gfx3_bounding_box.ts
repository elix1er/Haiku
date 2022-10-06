import { Utils } from '../core/utils';

class Gfx3BoundingBox {
  min: vec3;
  max: vec3;

  constructor(min: vec3 = [0, 0, 0], max: vec3 = [0, 0, 0]) {
    this.min = min;
    this.max = max;
  }

  static createFromVertices(vertices: Array<number>, vertexStride: number): Gfx3BoundingBox {
    const min: vec3 = [vertices[0], vertices[1], vertices[2]];
    const max: vec3 = [vertices[0], vertices[1], vertices[2]];

    for (let i = 0; i < vertices.length; i += vertexStride) {
      for (let j = 0; j < 3; j++) {
        const v = vertices[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }

    return new Gfx3BoundingBox(min, max);
  }

  static merge(aabbs: Array<Gfx3BoundingBox>) {
    const min = aabbs[0].min;
    const max = aabbs[0].max;

    for (const aabb of aabbs) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(aabb.min[i], min[i]);
        max[i] = Math.max(aabb.max[i], max[i]);
      }
    }

    return new Gfx3BoundingBox(min, max);
  }

  mergeOne(aabb: Gfx3BoundingBox) {
    var min = this.min;
    var max = this.max;

   for (let i = 0; i < 3; i++) {
    min[i] = Math.min(aabb.min[i], min[i]);
    max[i] = Math.max(aabb.max[i], max[i]);
   }

   return new Gfx3BoundingBox(min, max);
  }
  getCenter(): vec3 {
    const w = this.max[0] - this.min[0];
    const h = this.max[1] - this.min[1];
    const d = this.max[2] - this.min[2];
    const x = this.min[0] + (w * 0.5);
    const y = this.min[1] + (h * 0.5);
    const z = this.min[2] + (d * 0.5);
    return [x, y, z];
  }

  getSize(): vec3 {
    const w = this.max[0] - this.min[0];
    const h = this.max[1] - this.min[1];
    const d = this.max[2] - this.min[2];
    return [w, h, d];
  }

  getRadius(): number {
    return Utils.VEC3_DISTANCE(this.min, this.max) * 0.5;
  }

  getPerimeter(): number {
    const w = this.max[0] - this.min[0];
    const d = this.max[2] - this.min[2];
    return w + w + d + d;
  }

  getVolume(): number {
    const w = this.max[0] - this.min[0];
    const h = this.max[1] - this.min[1];
    const d = this.max[2] - this.min[2];
    return w * h * d;
  }

  transform(matrix: mat4): Gfx3BoundingBox {
    const points: Array<vec3> = [];
    points.push([this.min[0], this.min[1], this.min[2]]);
    points.push([this.max[0], this.min[1], this.min[2]]);
    points.push([this.max[0], this.max[1], this.min[2]]);
    points.push([this.min[0], this.max[1], this.min[2]]);
    points.push([this.min[0], this.max[1], this.max[2]]);
    points.push([this.max[0], this.max[1], this.max[2]]);
    points.push([this.max[0], this.min[1], this.max[2]]);
    points.push([this.min[0], this.min[1], this.max[2]]);

    const transformedPoints = points.map((p) => {
      return Utils.MAT4_MULTIPLY_BY_VEC4(matrix, [p[0], p[1], p[2], 1]);
    });

    const min: vec3 = [transformedPoints[0][0], transformedPoints[0][1], transformedPoints[0][2]];
    const max: vec3 = [transformedPoints[0][0], transformedPoints[0][1], transformedPoints[0][2]];

    for (let i = 0; i < transformedPoints.length; i++) {
      for (let j = 0; j < 3; j++) {
        const v = transformedPoints[i][j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }

    return new Gfx3BoundingBox(min, max);
  }

  isPointInside(x: number, y: number, z: number): boolean {
    return (
      (x >= this.min[0] && x <= this.max[0]) &&
      (y >= this.min[1] && y <= this.max[1]) &&
      (z >= this.min[2] && z <= this.max[2])
    );
  }

  intersectBoundingBox(aabb: Gfx3BoundingBox): boolean {
    return (
      (this.min[0] <= aabb.max[0] && this.max[0] >= aabb.min[0]) &&
      (this.min[1] <= aabb.max[1] && this.max[1] >= aabb.min[1]) &&
      (this.min[2] <= aabb.max[2] && this.max[2] >= aabb.min[2])
    );
  }

  reset(): void {
    this.min = [0, 0, 0];
    this.max = [0, 0, 0];
  }

  setMin(min: vec3): void {
    this.min = min;
  }

  setMax(max: vec3): void {
    this.max = max;
  }
}

export { Gfx3BoundingBox };
import { Utils } from '../core/utils';

class Gfx2BoundingRect {
  min: vec2;
  max: vec2;

  constructor(min: vec2 = [0, 0], max: vec2 = [0, 0]) {
    this.min = min;
    this.max = max;
  }

  static create(x: number, y:number, width: number, height: number): Gfx2BoundingRect {
    const box = new Gfx2BoundingRect();
    box.min[0] = x;
    box.min[1] = y;
    box.max[0] = x + width;
    box.max[1] = y + height;
    return box;
  }

  fromVertices(vertices: Array<number>): void {
    const min: vec2 = [vertices[0], vertices[1]];
    const max: vec2 = [vertices[0], vertices[1]];

    for (let i = 0; i < vertices.length; i += 2) {
      for (let j = 0; j < 2; j++) {
        const v = vertices[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }

    this.min = min;
    this.max = max;
  }

  getCenter(): vec2 {
    const w = this.max[0] - this.min[0];
    const h = this.max[1] - this.min[1];
    const x = this.min[0] + (w * 0.5);
    const y = this.min[1] + (h * 0.5);
    return [x, y];
  }

  getSize(): vec2 {
    const w = this.max[0] - this.min[0];
    const h = this.max[1] - this.min[1];
    return [w, h];
  }

  getRadius(): number {
    return Utils.VEC2_DISTANCE(this.min, this.max) * 0.5;
  }

  getPerimeter(): number {
    const w = this.max[0] - this.min[0];
    const h = this.max[1] - this.min[1];
    return w + w + h + h;
  }

  getVolume(): number {
    return (this.max[0] - this.min[0]) * (this.max[1] - this.min[1]);
  }

  transform(matrix: mat3): Gfx2BoundingRect {
    const points: Array<vec2> = [];
    points.push([this.min[0], this.min[1]]);
    points.push([this.max[0], this.min[1]]);
    points.push([this.max[0], this.max[1]]);
    points.push([this.min[0], this.max[1]]);

    const transformedPoints = points.map((p) => {
      return Utils.MAT3_MULTIPLY_BY_VEC3(matrix, [p[0], p[1], 1]);
    });

    const min: vec2 = [transformedPoints[0][0], transformedPoints[0][1]];
    const max: vec2 = [transformedPoints[0][0], transformedPoints[0][1]];

    for (let i = 0; i < transformedPoints.length; i++) {
      for (let j = 0; j < 2; j++) {
        const v = transformedPoints[i][j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }

    return new Gfx2BoundingRect(min, max);
  }

  isPointInside(x: number, y: number): boolean {
    return (
      (x >= this.min[0] && x <= this.max[0]) &&
      (y >= this.min[1] && y <= this.max[1])
    );
  }

  intersectBoundingRect(aabr: Gfx2BoundingRect): boolean {
    return (
      (this.min[0] <= aabr.max[0] && this.max[0] >= aabr.min[0]) &&
      (this.min[1] <= aabr.max[1] && this.max[1] >= aabr.min[1])
    );
  }
}

export { Gfx2BoundingRect };
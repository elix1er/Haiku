import { UT } from '../core/utils';

class Gfx2BoundingRect {
  min: vec2;
  max: vec2;

  constructor(min: vec2 = [0, 0], max: vec2 = [0, 0]) {
    this.min = min;
    this.max = max;
  }

  static createFrom(minx: number, miny: number, maxx: number, maxy: number): Gfx2BoundingRect {
    const rect = new Gfx2BoundingRect();
    rect.min[0] = minx;
    rect.min[1] = miny;
    rect.max[0] = maxx;
    rect.max[1] = maxy;
    return rect;
  }

  static createFromCoord(x: number, y: number, w: number, h: number): Gfx2BoundingRect {
    const rect = new Gfx2BoundingRect();
    rect.min[0] = x;
    rect.min[1] = y;
    rect.max[0] = x + w;
    rect.max[1] = y + h;
    return rect;
  }

  static createFromCenter(x: number, y: number, w: number, h: number): Gfx2BoundingRect {
    const rect = new Gfx2BoundingRect();
    rect.min[0] = x - (w * 0.5);
    rect.min[1] = y - (h * 0.5);
    rect.max[0] = x + (w * 0.5);
    rect.max[1] = y + (h * 0.5);
    return rect;
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

  merge(rect: Gfx2BoundingRect): Gfx2BoundingRect {
    const min: vec2 = [this.min[0], this.min[1]];
    const max: vec2 = [this.max[0], this.max[2]];

    for (let i = 0; i < 2; i++) {
      min[i] = Math.min(rect.min[i], min[i]);
      max[i] = Math.max(rect.max[i], max[i]);
    }

    return new Gfx2BoundingRect(min, max);
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
    return UT.VEC2_DISTANCE(this.min, this.max) * 0.5;
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
    const points: Array<[number, number]> = [];
    points.push([this.min[0], this.min[1]]);
    points.push([this.max[0], this.min[1]]);
    points.push([this.max[0], this.max[1]]);
    points.push([this.min[0], this.max[1]]);

    const transformedPoints = points.map((p) => {
      return UT.MAT3_MULTIPLY_BY_VEC3(matrix, [p[0], p[1], 1]);
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
    return UT.COLLIDE_POINT_TO_RECT([x, y], this.min, this.max);
  }

  intersectBoundingRect(aabr: Gfx2BoundingRect): boolean {
    return UT.COLLIDE_RECT_TO_RECT(this.min, this.max, aabr.min, aabr.max);
  }
}

export { Gfx2BoundingRect };
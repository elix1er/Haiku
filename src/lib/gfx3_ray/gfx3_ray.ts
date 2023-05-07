import { Utils } from '../core/utils';

class Gfx3Ray {
  static intersectTriangle(origin: vec3, dir: vec3, a: vec3, b: vec3, c: vec3, onlyDir: boolean = false, outIntersectPoint: vec3 = [0, 0, 0]): boolean {
    const ab = Utils.VEC3_SUBSTRACT(b, a);
    const ac = Utils.VEC3_SUBSTRACT(c, a);
    const n = Utils.VEC3_CROSS(ab, ac);
    const s = Utils.VEC3_DOT(dir, n);

    if (onlyDir && s >= 0) {
      return false;
    }

    if (s > -Utils.EPSILON && s < Utils.EPSILON) {
      return false;
    }

    const d = Utils.VEC3_DOT(n, a) * -1;
    const l = Utils.VEC3_DOT(n, origin) * -1;
    const t = (l - d) / s;

    const p = Utils.VEC3_CREATE(origin[0] + (dir[0] * t), origin[1] + (dir[1] * t), origin[2] + (dir[2] * t));
    const bc = Utils.VEC3_SUBSTRACT(c, b);
    const ca = Utils.VEC3_SUBSTRACT(a, c);
    const ap = Utils.VEC3_SUBSTRACT(p, a);
    const bp = Utils.VEC3_SUBSTRACT(p, b);
    const cp = Utils.VEC3_SUBSTRACT(p, c);

    outIntersectPoint[0] = p[0];
    outIntersectPoint[1] = p[1];
    outIntersectPoint[2] = p[2];

    const crossAPAB = Utils.VEC3_CROSS(ab, ap);
    if (Utils.VEC3_DOT(crossAPAB, n) < Utils.EPSILON) {
      return false;
    }

    const crossBPBC = Utils.VEC3_CROSS(bc, bp);
    if (Utils.VEC3_DOT(crossBPBC, n) < Utils.EPSILON) {
      return false;
    }

    const crossCPCA = Utils.VEC3_CROSS(ca, cp);
    if (Utils.VEC3_DOT(crossCPCA, n) < Utils.EPSILON) {
      return false;
    }

    return true;
  }

  static intersectBox(origin: vec3, dir: vec3, min: vec3, max: vec3, outIntersectPoint: vec3 = [0, 0, 0]): boolean {
    for (let i = 0; i < 3; i++) {
      if (origin[i] < min[i]) {
        const t = (min[i] - origin[i]) / (dir[i]);
        const x = origin[0] + dir[0] * t;
        const y = origin[1] + dir[1] * t;
        const z = origin[2] + dir[2] * t;
        if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2]) {
          outIntersectPoint[0] = x;
          outIntersectPoint[1] = y;
          outIntersectPoint[2] = z;
          return true;
        }
      }
      else if (origin[i] > max[i]) {
        const t = (max[i] - origin[i]) / (dir[i]);
        const x = origin[0] + (dir[0] * t);
        const y = origin[1] + (dir[1] * t);
        const z = origin[2] + (dir[2] * t);
        if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2]) {
          outIntersectPoint[0] = x;
          outIntersectPoint[1] = y;
          outIntersectPoint[2] = z;
          return true;
        }
      }
    }

    return false;
  }
}

export { Gfx3Ray };
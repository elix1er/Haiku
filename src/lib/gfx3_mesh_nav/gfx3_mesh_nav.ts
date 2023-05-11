import { Utils } from '../core/utils';
import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';
import { Gfx3MeshJSM } from '../gfx3_mesh/gfx3_mesh_jsm';
import { SHADER_VERTEX_ATTR_COUNT } from '../gfx3_mesh/gfx3_mesh_shader';
import { Gfx3Ray } from '../gfx3_ray/gfx3_ray';
import { TreePartitionNode } from '../tree/tree_partition_node';
import { TreePartition3D } from '../tree/tree_partition_3d';

const MOVE_MAX_RECURSIVE_CALL = 2;

interface NavInfo {
  move: vec3,
  collideFloor: boolean,
  collideWall: boolean,
};

class Frag extends Gfx3BoundingBox {
  a: vec3;
  b: vec3;
  c: vec3;
  n: vec3;
  t: vec3;

  constructor(vertices: Array<number>) {
    super();
    this.a = [0, 0, 0];
    this.b = [0, 0, 0];
    this.c = [0, 0, 0];
    this.n = [0, 0, 0];
    this.t = [0, 0, 0];

    this.a[0] = vertices[(0 * SHADER_VERTEX_ATTR_COUNT) + 0];
    this.a[1] = vertices[(0 * SHADER_VERTEX_ATTR_COUNT) + 1];
    this.a[2] = vertices[(0 * SHADER_VERTEX_ATTR_COUNT) + 2];

    this.b[0] = vertices[(1 * SHADER_VERTEX_ATTR_COUNT) + 0];
    this.b[1] = vertices[(1 * SHADER_VERTEX_ATTR_COUNT) + 1];
    this.b[2] = vertices[(1 * SHADER_VERTEX_ATTR_COUNT) + 2];

    this.c[0] = vertices[(2 * SHADER_VERTEX_ATTR_COUNT) + 0];
    this.c[1] = vertices[(2 * SHADER_VERTEX_ATTR_COUNT) + 1];
    this.c[2] = vertices[(2 * SHADER_VERTEX_ATTR_COUNT) + 2];

    this.n = Utils.VEC3_TRIANGLE_NORMAL(this.a, this.b, this.c);
    this.t = Utils.VEC3_CROSS([0, 1, 0], this.n);
    super.fromVertices([...this.a, ...this.b, ...this.c], 3);
  }
}

class Gfx3MeshNav {
  btree: TreePartitionNode<Gfx3BoundingBox>;
  frags: Array<Frag>;
  lift: number;

  constructor() {
    this.btree = new TreePartitionNode<Gfx3BoundingBox>(20, 0, 10, new TreePartition3D(new Gfx3BoundingBox([0, 0, 0], [0, 0, 0]), 'x'));
    this.frags = [];
    this.lift = 0.5;
  }

  loadFromJSM(jsm: Gfx3MeshJSM): void {
    this.btree = new TreePartitionNode<Gfx3BoundingBox>(20, 0, 10, new TreePartition3D(jsm.getBoundingBox(), 'x'));
    this.frags = [];

    for (let i = 0; i < jsm.getVertexCount(); i += 3) {
      const vertices = jsm.getVertices();
      const frag = new Frag(vertices.slice((i + 0) * SHADER_VERTEX_ATTR_COUNT, (i + 3) * SHADER_VERTEX_ATTR_COUNT));
      this.btree.addChild(frag);
      this.frags.push(frag);
    }
  }

  moveWalker(center: vec3, size: vec3, move: vec3): NavInfo {
    const aabb = Gfx3BoundingBox.create(center, size);
    const res: NavInfo = {
      move: [move[0], move[1], move[2]],
      collideFloor: false,
      collideWall: false
    };

    aabb.min[1] += this.lift;
    const wallFrags = this.frags.filter(frag => frag.intersectBoundingBox(new Gfx3BoundingBox(
      [aabb.min[0] + move[0], aabb.min[1] + move[1], aabb.min[2] + move[2]],
      [aabb.max[0] + move[0], aabb.max[1] + move[1], aabb.max[2] + move[2]]
    )));

    const points: Array<vec3> = [
      [aabb.min[0], aabb.min[1] + this.lift, aabb.max[2]],
      [aabb.min[0], aabb.min[1] + this.lift, aabb.min[2]],
      [aabb.max[0], aabb.min[1] + this.lift, aabb.min[2]],
      [aabb.max[0], aabb.min[1] + this.lift, aabb.max[2]]
    ];

    let deviatedPoints: Array<boolean> = [];
    let i = 0;

    while (i < points.length) {
      if (deviatedPoints[i]) {
        i++;
        continue;
      }

      const newMove = MOVE(wallFrags, points[i], [res.move[0], res.move[2]]);

      if (newMove[0] == 0 && newMove[1] == 0) {
        res.move[0] = 0;
        res.move[2] = 0;
        res.collideWall = true;
        break;
      }
      else if (newMove[0] != res.move[0] || newMove[1] != res.move[2]) {
        res.move[0] = newMove[0];
        res.move[2] = newMove[1];
        res.collideWall = true;
        deviatedPoints[i] = true;
        i = 0;
        continue;
      }

      i++;
    }

    aabb.min[1] -= this.lift;
    const floorFrags = this.frags.filter(frag => frag.intersectBoundingBox(new Gfx3BoundingBox(
      [center[0], aabb.min[1] + res.move[1], center[2]],
      [center[0], aabb.max[1] + res.move[1], center[2]]
    )));

    const footElevation = center[1] - (size[1] * 0.5);
    const elevation = GET_ELEVATION(floorFrags, [center[0] + res.move[0], footElevation, center[2] + res.move[2]]);
    const delta = Math.abs(elevation - footElevation);

    if (elevation != Infinity && (move[1] == 0 || delta <= Math.abs(move[1]))) {
      res.collideFloor = true;
      res.move[1] = elevation - footElevation;
    }

    return res;
  }
}

export { Gfx3MeshNav };

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function MOVE(frags: Array<Frag>, point: vec3, move: vec2, i: number = 0): vec2 {
  let minFrag = null;
  let minFragLength = 999999;

  if (i > MOVE_MAX_RECURSIVE_CALL) {
    return [0, 0];
  }

  for (const frag of frags) {
    const outIntersect: vec3 = [0, 0, 0];
    if (Gfx3Ray.intersectPlan(point, [move[0], 0, move[1]], frag.a, frag.b, frag.c, frag.n, true, outIntersect)) {
      const pen = Utils.VEC3_SUBSTRACT(outIntersect, point);
      const penLength = Utils.VEC3_LENGTH(pen);
      if (penLength <= Utils.VEC2_LENGTH(move) + 0.001 && penLength < minFragLength) {
        minFragLength = penLength;
        minFrag = frag;
      }
    }
  }

  if (minFrag) {
    const newMove = GET_MOVE_PROJECTION(minFrag, move);
    return MOVE(frags, point, newMove, i + 1);
  }

  return move;
}

function GET_MOVE_PROJECTION(frag: Frag, move: vec2): vec2 {
  const newMove = Utils.VEC2_PROJECTION_COS([move[0], move[1]], [frag.t[0], frag.t[2]]);
  return newMove;
}

function GET_ELEVATION(frags: Array<Frag>, center: vec3): number {
  for (const frag of frags) {
    const outIntersect: vec3 = [0, 0, 0];
    if (Gfx3Ray.intersectTriangle(center, [0, -1, 0], frag.a, frag.b, frag.c, true, outIntersect)) {
      return outIntersect[1];
    }
  }

  return Infinity;
}
import { Utils } from '../core/utils';
import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';
import { Gfx3MeshJSM } from '../gfx3_mesh/gfx3_mesh_jsm';
import { SHADER_VERTEX_ATTR_COUNT } from '../gfx3_mesh/gfx3_mesh_shader';
import { Gfx3Ray } from '../gfx3_ray/gfx3_ray';
import { TreePartitionNode } from '../tree/tree_partition_node';
import { TreePartition3D } from '../tree/tree_partition_3d';

interface NavInfo {
  move: vec3,
  collideFloor: boolean,
  collideWall: boolean,
};

class Frag extends Gfx3BoundingBox {
  a: vec3;
  b: vec3;
  c: vec3;

  constructor(vertices: Array<number>) {
    super();
    this.a = [0, 0, 0];
    this.b = [0, 0, 0];
    this.c = [0, 0, 0];

    this.a[0] = vertices[(0 * SHADER_VERTEX_ATTR_COUNT) + 0];
    this.a[1] = vertices[(0 * SHADER_VERTEX_ATTR_COUNT) + 1];
    this.a[2] = vertices[(0 * SHADER_VERTEX_ATTR_COUNT) + 2];

    this.b[0] = vertices[(1 * SHADER_VERTEX_ATTR_COUNT) + 0];
    this.b[1] = vertices[(1 * SHADER_VERTEX_ATTR_COUNT) + 1];
    this.b[2] = vertices[(1 * SHADER_VERTEX_ATTR_COUNT) + 2];

    this.c[0] = vertices[(2 * SHADER_VERTEX_ATTR_COUNT) + 0];
    this.c[1] = vertices[(2 * SHADER_VERTEX_ATTR_COUNT) + 1];
    this.c[2] = vertices[(2 * SHADER_VERTEX_ATTR_COUNT) + 2];

    super.fromVertices([...this.a, ...this.b, ...this.c], 3);
  }
}

class Gfx3MeshNav {
  btree: TreePartitionNode<Gfx3BoundingBox>;
  frags: Array<Frag>;
  lift: number;
  floorCaptureLimit: number;
  wallCaptureLimit: number;

  constructor() {
    this.btree = new TreePartitionNode<Gfx3BoundingBox>(20, 0, 10, new TreePartition3D(new Gfx3BoundingBox([0, 0, 0], [0, 0, 0]), 'x'));
    this.frags = [];
    this.lift = 0.5;
    this.floorCaptureLimit = 0.1;
    this.wallCaptureLimit = 0.1;
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

    const min: vec3 = [aabb.min[0] - 0.1, aabb.min[1] - 0.1, aabb.min[2] - 0.1];
    const max: vec3 = [aabb.max[0] + 0.1, aabb.max[1] + 0.1, aabb.max[2] + 0.1];
    const frags = this.frags.filter(frag => frag.intersectBoundingBox(new Gfx3BoundingBox(min, max)));

    // Let's go to check wall triangles now.
    // To do this, firstly we need to get 4 points, one by corner.
    // We need to lift these points because many reasons to do this:
    // 1. Avoid possible collide with little border (a. they are simply avoid because aabb is upper of them).
    // 2. Avoid some intolerent situation for the player caused by little object on the floor (a. idem).
    const points: Array<vec3> = [
      [aabb.min[0], aabb.min[1] + this.lift, aabb.max[2]],
      [aabb.min[0], aabb.min[1] + this.lift, aabb.min[2]],
      [aabb.max[0], aabb.min[1] + this.lift, aabb.min[2]],
      [aabb.max[0], aabb.min[1] + this.lift, aabb.max[2]]
    ];

    let deviatedPoints: Array<boolean> = [];
    let numDeviations = 0;
    let i = 0;

    while (i < points.length) {
      if (deviatedPoints[i]) {
        i++;
        continue;
      }

      // console.log('start point checking:', i);
      const newMove = MOVE(frags, points[i], [res.move[0], res.move[2]], this.wallCaptureLimit);
      // console.log('end point checking:', i);

      if (newMove[0] == 0 && newMove[1] == 0) {
        res.move[0] = 0;
        res.move[2] = 0;
        res.collideWall = true;
        // console.log('blocked');
        break;
      }
      else if (newMove[0] != res.move[0] || newMove[1] != res.move[2]) {
        res.move[0] = newMove[0];
        res.move[2] = newMove[1];
        res.collideWall = true;
        numDeviations++;
        deviatedPoints[i] = true;
        i = 0;
        continue;
      }

      i++;
    }

    // We check the floor elevation on the next position and correct the delta between current elevation and floor elevation.
    // Note: This is done only if the impact delta is less or equal to the floorCaptureLimit.
    const footElevation = center[1] - (size[1] * 0.5);
    const elevation = GET_ELEVATION(frags, [center[0] + res.move[0], footElevation, center[2] + res.move[2]], this.floorCaptureLimit);

    if (elevation != Infinity) {
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

function MOVE(frags: Array<Frag>, point: vec3, move: vec2, captureLimit: number): vec2 {
  for (const frag of frags) {
    const outIntersect: vec3 = [0, 0, 0];
    const collide = Gfx3Ray.intersectTriangle(point, [move[0], 0, move[1]], frag.a, frag.b, frag.c, true, outIntersect);
    const delta = Utils.VEC3_SUBSTRACT(outIntersect, point);
    const deltaLength = Utils.VEC3_LENGTH(delta);

    if (collide && deltaLength <= captureLimit) {
      // If point collide, we compute the projection of the move on the frag to able sliding.
      // Finally we correct the gap between point and edge to adding delta to the move.
      const newMove = GET_MOVE_PROJECTION(frag, move);
      newMove[0] += delta[0] - (Math.sign(delta[0]) * Utils.EPSILON);
      newMove[1] += delta[2] - (Math.sign(delta[2]) * Utils.EPSILON);

      // We create the new projected point and a very small AABB.
      // And we check if the new projected point is always on the frag.
      // If yes, no problem we can return the new position.
      // Otherwise, the projected point is out of the current frag and we need to search the good frag.
      // If no frag is found, no solution for this point so return a zero move.
      const newPos = Utils.VEC3_ADD(point, [newMove[0], 0, newMove[1]]);
      const newAABB = Gfx3BoundingBox.create(newPos, [0.001, 0.001, 0.001]);
      if (frag.intersectBoundingBox(newAABB)) {
        return newMove;
      }
      else {
        console.log('not intersect');
        for (const otherFrag of frags) {
          if (otherFrag != frag) {
            continue;
          }

          if (otherFrag.intersectBoundingBox(newAABB)) {
            const newMove = GET_MOVE_PROJECTION(otherFrag, move);
            return newMove;
          }
        }

        return newMove;
      }
    }
  }

  return move;
}

function GET_MOVE_PROJECTION(frag: Frag, move: vec2): vec2 {
  const fragNormal = Utils.VEC3_TRIANGLE_NORMAL(frag.a, frag.b, frag.c);
  const fragTangeant = Utils.VEC3_CROSS([0, 1, 0], fragNormal);
  const newMove = Utils.VEC2_PROJECTION_COS([move[0], move[1]], [fragTangeant[0], fragTangeant[2]]);
  return newMove;
}

function GET_ELEVATION(frags: Array<Frag>, center: vec3, captureLimit: number): number {
  for (const frag of frags) {
    const outIntersect: vec3 = [0, 0, 0];
    const collide = Gfx3Ray.intersectTriangle(center, [0, -1, 0], frag.a, frag.b, frag.c, false, outIntersect);
    const delta = Utils.VEC3_SUBSTRACT(outIntersect, center);
    const deltaLength = Utils.VEC3_LENGTH(delta);

    if (collide && deltaLength <= captureLimit) {
      return outIntersect[1];
    }
  }

  return Infinity;
}
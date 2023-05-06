import { TreePartitionNode, ITreePartitionMethod, SplitResult } from './tree_partition_node';
import { Gfx2BoundingRect } from '../gfx2/gfx2_bounding_rect';

class TreePartition2D implements ITreePartitionMethod<Gfx2BoundingRect> {
  box: Gfx2BoundingRect;
  axis: 'x' | 'y';

  constructor(box: Gfx2BoundingRect, axis: 'x' | 'y') {
    this.box = box;
    this.axis = axis;
  }

  search(node: TreePartitionNode<Gfx2BoundingRect>, target: Gfx2BoundingRect, results: Array<Gfx2BoundingRect> = []): Array<Gfx2BoundingRect> {
    const method = node.getPartitionMethod() as TreePartition2D;
    const nodeBox = method.box;
    if (!nodeBox.intersectBoundingRect(target)) {
      return [];
    }

    const left = node.getLeft();
    const right = node.getRight();

    if (left && right) {
      left.search(target, results)
      right.search(target, results)
    }
    else {
      const children = node.getChildren();
      const max: number = children.length;
      for (let i: number = 0; i < max; i++) {
        if (children[i].intersectBoundingRect(target))
          results.push(children[i]);
      }
    }

    return results;
  }

  split(objects: Array<Gfx2BoundingRect>): SplitResult<Gfx2BoundingRect> {
    const left = [];
    const right = [];
    const center = this.box.getCenter();

    for (const object of objects) {
      if (this.axis === 'x') {
        if (object.min[0] >= center[0]) {
          right.push(object);
        }
        else {
          left.push(object);
        }
      }
      else {
        if (object.min[1] >= center[1]) {
          right.push(object);
        }
        else {
          left.push(object);
        }
      }
    }

    const boxes = (this.axis === 'x') ? SPLIT_VERTICAL(this.box) : SPLIT_HORIZONTAL(this.box);
    const newAxis = (this.axis === 'x') ? 'y' : 'x';
    const leftFunction = new TreePartition2D(boxes[0], newAxis);
    const rightFunction = new TreePartition2D(boxes[1], newAxis);

    return { left, right, leftFunction, rightFunction };
  }
}

export { TreePartition2D };

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function SPLIT_VERTICAL(aabb: Gfx2BoundingRect): Array<Gfx2BoundingRect> {
  const size = aabb.getSize();
  const center = aabb.getCenter();

  return [
    Gfx2BoundingRect.create(aabb.min[0], aabb.min[1], size[0] / 2, size[1]),
    Gfx2BoundingRect.create(center[0], aabb.min[1], size[0] / 2, size[1])
  ];
}

function SPLIT_HORIZONTAL(aabb: Gfx2BoundingRect): Array <Gfx2BoundingRect> {
  const size = aabb.getSize();
  const center = aabb.getCenter();

  return [
    Gfx2BoundingRect.create(aabb.min[0], aabb.min[1], size[0], size[1] / 2),
    Gfx2BoundingRect.create(aabb.min[0], center[1], size[0], size[1] / 2)
  ];
}
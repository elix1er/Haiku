export type SplitResult<T> = {
  left: Array<T>,
  right: Array<T>,
  leftFunction: ITreePartitionMethod<T>,
  rightFunction: ITreePartitionMethod<T>,
}

export interface ITreePartitionMethod<T> {
  split(objects: Array<T>): SplitResult<T>;
  search(node: TreePartitionNode<T>, ...params: any[]): Array<T>;
};

class TreePartitionNode<T> {
  maxChildren: number;
  depth: number;
  maxDepth: number;
  partitionMethod: ITreePartitionMethod<T>;
  parent: TreePartitionNode<T> | null = null;
  left: TreePartitionNode<T> | null = null;
  right: TreePartitionNode<T> | null = null;
  children: Array<T> = [];

  constructor(maxChildren: number, depth: number, maxDepth: number, partitionMethod: ITreePartitionMethod<T>) {
    this.reset();
    this.maxChildren = maxChildren;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.partitionMethod = partitionMethod;
  }

  search(...params: any[]): Array<T> {
    return this.partitionMethod.search(this, ...params);
  }

  reset() {
    this.children = [];
    this.left = null;
    this.right = null;
  }

  createSubNodes() {
    const results = this.partitionMethod.split(this.children);

    this.left = new TreePartitionNode(
      this.maxChildren,
      this.depth + 1,
      this.maxDepth,
      results.leftFunction
    );

    this.right = new TreePartitionNode(
      this.maxChildren,
      this.depth + 1,
      this.maxDepth,
      results.rightFunction
    );

    results.left.forEach(this.left.addChild.bind(this.left));
    results.right.forEach(this.right.addChild.bind(this.right));
    this.left.parent = this;
    this.right.parent = this;
    this.children = [];
  }

  getChildren(): Array<T> {
    return this.children;
  }

  addChild(object: T) {
    if (this.children.length >= this.maxChildren && this.depth < this.maxDepth) {
      this.createSubNodes();
    }

    if (this.left === null && this.right === null) {
      this.children.push(object);
    }
    else {
      const results = this.partitionMethod.split([object]);
      if (this.left && results.left.length > 0) {
        this.left.addChild(results.left[0]);
      }

      if (this.right && results.right.length > 0) {
        this.right.addChild(results.right[0]);
      }
    }
  }

  getPartitionMethod(): ITreePartitionMethod<T> {
    return this.partitionMethod;
  }

  getLeft(): TreePartitionNode<T> | null {
    return this.left;
  }

  getRight(): TreePartitionNode<T> | null {
    return this.right;
  }

  getDepth(): number {
    return this.depth;
  }

  setDepth(depth: number) {
    this.depth = depth;
  }
}

export { TreePartitionNode };
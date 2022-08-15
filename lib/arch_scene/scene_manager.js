class SceneManager {
  constructor() {
    this.nodes = [];
  }

  update(ts) {
    for (let node of this.nodes) {
      node.update(ts);
    }
  }

  draw() {
    for (let node of this.nodes) {
      if (node.isVisible()) {
        node.draw(viewIndex);
      }
    }
  }

  getNodesWithTag(tag) {
    let matching = [];
    for (let node of this.nodes) {
      if (node.hasTag(tag)) {
        matching.push(node);
      }
    }

    return matching;
  }

  addNode(node) {
    this.nodes.push(node);
  }

  removeNode(node) {
    this.nodes.splice(this.nodes.indexOf(node), 1);
  }

  removeNodeIf(cb) {
    let removed = [];
    for (let node of this.nodes) {
      if (cb && cb(node)) {
        removed.push(node);
        this.nodes.splice(this.nodes.indexOf(node), 1);
      }
    }

    return removed;
  }

  releaseNodes() {
    this.nodes = [];
  }
}

module.exports.SceneManager = SceneManager;
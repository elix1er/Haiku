let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');

class Line extends Gfx3Drawable {
  constructor(options = {}) {
    super();
    this.color = options.color ?? { r: 1, g: 1, b: 1 };
    this.max = options.max ?? -1;
    this.points = [];
  }

  update(ts) {
    this.clearVertices();
    for (let i = 0; i < this.points.length - 1; i++) {
      this.defineVertexColor(...this.points[i], this.color.r, this.color.g, this.color.b);
      this.defineVertexColor(...this.points[i + 1], this.color.r, this.color.g, this.color.b);
    }

    this.commitVertices();
  }

  draw() {
    gfx3Manager.drawDebugLineList(this.getModelMatrix(), this.vertexCount, this.vertices);
  }

  addPoint(x, y, z) {
    this.points.push([x, y, z]);
    if (this.max > 0 && this.max < this.points.length) {
      this.points.shift();
    }
  }
}

module.exports.Line = Line;
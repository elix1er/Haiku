let { eventManager } = require('../core/event_manager');
let { gfx3Manager } = require('../gfx3/gfx3_manager');
let { Utils } = require('../core/utils');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');

class Gfx3Mover extends Gfx3Drawable {
  constructor() {
    super();
    this.points = [];
    this.speed = 1;
    this.drawable = null;
    this.currentPointIndex = 1;
    this.playing = false;
    this.looped = false;
  }

  async loadFromData(data) {
    this.points = [];
    for (let point of data['Points']) {
      this.points.push(point);
    }

    this.clearVertices();

    for (let i = 0; i < data['Points'].length - 1; i++) {
      let vax = data['Points'][i][0];
      let vay = data['Points'][i][1];
      let vaz = data['Points'][i][2];
      let vbx = data['Points'][i + 1][0];
      let vby = data['Points'][i + 1][1];
      let vbz = data['Points'][i + 1][2];
      this.defineVertexColor(vax, vay, vaz, 1, 1, 1);
      this.defineVertexColor(vbx, vby, vbz, 1, 1, 1);
    }

    this.commitVertices();

    this.speed = data['Speed'];
    this.looped = Utils.VEC3_ISEQUAL(data['Points'].at(-1), data['Points'].at(0));
  }

  update(ts) {
    if (this.points.length < 2) {
      return;
    }
    if (!this.drawable) {
      return;
    }
    if (!this.playing) {
      return;
    }

    let position = this.drawable.getPosition();
    let delta = Utils.VEC3_SUBSTRACT(this.points[this.currentPointIndex], position);
    let direction = Utils.VEC3_NORMALIZE(delta);
    let move = Utils.VEC3_SCALE(direction, this.speed * (ts / 1000));
    let nextPosition = Utils.VEC3_ADD(position, move);

    this.drawable.setPosition(nextPosition[0], nextPosition[1], nextPosition[2]);
    this.drawable.setRotation(0, Utils.VEC2_ANGLE([direction[0], direction[2]]), 0);

    if (Utils.VEC3_LENGTH(delta) < 0.1) {
      if (this.currentPointIndex == this.points.length - 1) {
        this.currentPointIndex = this.looped ? 1 : this.points.length - 1;
        this.playing = this.looped;
        eventManager.emit(this, 'E_FINISHED');
      }
      else {
        this.currentPointIndex = this.currentPointIndex + 1;
      }
    }
  }

  draw() {
    gfx3Manager.drawDebugLineList(Utils.MAT4_IDENTITY(), this.vertexCount, this.vertices);
  }

  play() {
    if (this.points.length < 2) {
      throw new Error('Gfx3Mover::play: points is not defined.');
    }
    if (!this.drawable) {
      throw new Error('Gfx3Mover::play: drawable is not defined.');
    }

    this.drawable.setPosition(this.points[0][0], this.points[0][1], this.points[0][2]);
    this.currentPointIndex = 1;
    this.playing = true;
  }

  setDrawable(drawable) {
    this.drawable = drawable;
  }
}

module.exports.Gfx3Mover = Gfx3Mover;
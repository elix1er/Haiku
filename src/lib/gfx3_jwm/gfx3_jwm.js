let { gfx3Manager } = require('../gfx3/gfx3_manager');
let { Utils } = require('../core/utils');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');

let MOVE_MAX_RECURSIVE_CALL = 5;

class Sector {
  constructor() {
    this.v1 = [];
    this.v2 = [];
    this.v3 = [];
  }
}

class Access {
  constructor() {
    this.ids = [];
  }
}

class Neighbor {
  constructor() {
    this.s1 = -1;
    this.s2 = -1;
    this.s3 = -1;
  }
}

class Point {
  constructor() {
    this.sectorIndex = -1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
}

class Walker {
  constructor() {
    this.id = '';
    this.points = [];
  }
}

class Gfx3JWM extends Gfx3Drawable {
  constructor() {
    super();
    this.sectors = [];
    this.accessPool = [];
    this.neighborPool = [];
    this.walkers = [];
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JWM') {
      throw new Error('GfxJWM::loadFromFile(): File not valid !');
    }

    this.sectors = [];
    for (let obj of json['Sectors']) {
      let sector = new Sector();
      sector.v1 = obj[0];
      sector.v2 = obj[1];
      sector.v3 = obj[2];
      this.sectors.push(sector);
    }

    this.accessPool = [];
    for (let obj of json['AccessPool']) {
      let access = new Access();
      access.ids = obj;
      this.accessPool.push(access);
    }

    this.neighborPool = [];
    for (let obj of json['NeighborPool']) {
      let neighbor = new Neighbor();
      neighbor.s1 = obj[0];
      neighbor.s2 = obj[1];
      neighbor.s3 = obj[2];
      this.neighborPool.push(neighbor);
    }
  }

  update() {
    this.clearVertices();

    for (let sector of this.sectors) {
      this.defineVertexColor(sector.v1[0], sector.v1[1], sector.v1[2], 1, 1, 1);
      this.defineVertexColor(sector.v2[0], sector.v2[1], sector.v2[2], 1, 1, 1);
      this.defineVertexColor(sector.v1[0], sector.v1[1], sector.v1[2], 1, 1, 1);
      this.defineVertexColor(sector.v3[0], sector.v3[1], sector.v3[2], 1, 1, 1);
      this.defineVertexColor(sector.v2[0], sector.v2[1], sector.v2[2], 1, 1, 1);
      this.defineVertexColor(sector.v3[0], sector.v3[1], sector.v3[2], 1, 1, 1);
    }

    for (let walker of this.walkers) {
      this.defineVertexColor(walker.points[1].x, walker.points[1].y, walker.points[1].z, 1, 1, 1);
      this.defineVertexColor(walker.points[2].x, walker.points[2].y, walker.points[2].z, 1, 1, 1);
      this.defineVertexColor(walker.points[2].x, walker.points[2].y, walker.points[2].z, 1, 1, 1);
      this.defineVertexColor(walker.points[3].x, walker.points[3].y, walker.points[3].z, 1, 1, 1);
      this.defineVertexColor(walker.points[3].x, walker.points[3].y, walker.points[3].z, 1, 1, 1);
      this.defineVertexColor(walker.points[4].x, walker.points[4].y, walker.points[4].z, 1, 1, 1);
      this.defineVertexColor(walker.points[4].x, walker.points[4].y, walker.points[4].z, 1, 1, 1);
      this.defineVertexColor(walker.points[1].x, walker.points[1].y, walker.points[1].z, 1, 1, 1);
    }

    this.commitVertices();
  }

  draw() {
    gfx3Manager.drawDebugLineList(this.getModelMatrix(), this.vertexCount, this.vertices);
  }

  addWalker(id, x, z, radius) {
    if (this.walkers.find(w => w.id == id)) {
      throw new Error('Gfx3JWM::moveWalker: walker with id ' + id + ' already exist.');
    }

    let walker = new Walker();
    walker.id = id;
    walker.points[0] = this.utilsCreatePoint(x, z);
    walker.points[1] = this.utilsCreatePoint(x + radius, z + radius);
    walker.points[2] = this.utilsCreatePoint(x + radius, z - radius);
    walker.points[3] = this.utilsCreatePoint(x - radius, z - radius);
    walker.points[4] = this.utilsCreatePoint(x - radius, z + radius);
    this.walkers.push(walker);
    return walker;
  }

  moveWalker(id, mx, mz) {
    let walker = this.walkers.find(w => w.id == id);
    if (!walker) {
      throw new Error('Gfx3JWM::moveWalker: walker with id ' + id + ' cannot be found.');
    }

    let points = walker.points.slice();
    let pointSectors = [];
    let pointElevations = [];

    pointSectors[0] = points[0].sectorIndex;
    pointSectors[1] = points[1].sectorIndex;
    pointSectors[2] = points[2].sectorIndex;
    pointSectors[3] = points[3].sectorIndex;
    pointSectors[4] = points[4].sectorIndex;

    pointElevations[0] = points[0].y;
    pointElevations[1] = points[1].y;
    pointElevations[2] = points[2].y;
    pointElevations[3] = points[3].y;
    pointElevations[4] = points[4].y;

    // prevent dead end.
    let numDeviations = 0;
    let moving = false;
    let i = 0;

    while (i < points.length) {
      // if two points are deviated it is a dead-end, no reasons to continue...
      if (numDeviations >= 2) {
        moving = false;
        break;
      }

      let point = points[i];
      let deviation = false;
      if (point) {
        let moveInfo = this.utilsMove(point.sectorIndex, point.x, point.z, mx, mz);
        if (moveInfo.mx == 0 && moveInfo.mz == 0) {
          moving = false;
          break;
        }

        if (moveInfo.mx != mx || moveInfo.mz != mz) {
          numDeviations++;
          mx = moveInfo.mx;
          mz = moveInfo.mz;
          deviation = true;
          points[i] = null;
        }

        moving = true;
        pointSectors[i] = moveInfo.sectorIndex;
        pointElevations[i] = moveInfo.elevation;
      }

      // if deviation, we need to restart from 0 to update other points with new mx,mz.
      i = deviation ? 0 : i + 1;
    }

    if (moving) {
      walker.points[0].sectorIndex = pointSectors[0];
      walker.points[1].sectorIndex = pointSectors[1];
      walker.points[2].sectorIndex = pointSectors[2];
      walker.points[3].sectorIndex = pointSectors[3];
      walker.points[4].sectorIndex = pointSectors[4];
      walker.points[0].x += mx;
      walker.points[1].x += mx;
      walker.points[2].x += mx;
      walker.points[3].x += mx;
      walker.points[4].x += mx;
      walker.points[0].y = pointElevations[0];
      walker.points[1].y = pointElevations[1];
      walker.points[2].y = pointElevations[2];
      walker.points[3].y = pointElevations[3];
      walker.points[4].y = pointElevations[4];
      walker.points[0].z += mz;
      walker.points[1].z += mz;
      walker.points[2].z += mz;
      walker.points[3].z += mz;
      walker.points[4].z += mz;
    }

    return walker.points[0];
  }

  clearWalkers() {
    this.walkers = [];
  }

  utilsFindLocationInfo(x, z) {
    for (let i = 0; i < this.sectors.length; i++) {
      let a = this.sectors[i].v1;
      let b = this.sectors[i].v2;
      let c = this.sectors[i].v3;
      if (Utils.POINT_IN_TRIANGLE(a, b, c, [x, z])) {
        return { sectorIndex: i, elev: Utils.GET_TRIANGLE_ELEVATION(a, b, c, [x, z]) };
      }
    }

    return { sectorIndex: -1, elev: Infinity };
  }

  utilsMove(sectorIndex, x, z, mx, mz, i = 0) {
    let a = this.sectors[sectorIndex].v1;
    let b = this.sectors[sectorIndex].v2;
    let c = this.sectors[sectorIndex].v3;

    let elevation = Utils.GET_TRIANGLE_ELEVATION(a, b, c, [x + mx, z + mz]);
    if (elevation != Infinity) {
      return { sectorIndex, mx, mz, elevation };
    }

    if (i == MOVE_MAX_RECURSIVE_CALL) {
      return { sectorIndex, mx: 0, mz: 0, elevation: Infinity };
    }

    let sides = Utils.GET_TRIANGLE_SAME_SIDES(a, b, c, [x + mx, z + mz]);
    let ab = [b[0] - a[0], b[2] - a[2]];
    let bc = [c[0] - b[0], c[2] - b[2]];
    let ca = [a[0] - c[0], a[2] - c[2]];

    if (this.neighborPool[sectorIndex].s1 == -1 && sides.ab) {
      let [pmx, pmz] = Utils.VEC2_PROJECTION_COS([mx, mz], ab);
      return this.utilsMove(sectorIndex, x, z, pmx, pmz, i + 1);
    }
    else if (this.neighborPool[sectorIndex].s2 == -1 && sides.bc) {
      let [pmx, pmz] = Utils.VEC2_PROJECTION_COS([mx, mz], bc);
      return this.utilsMove(sectorIndex, x, z, pmx, pmz, i + 1);
    }
    else if (this.neighborPool[sectorIndex].s3 == -1 && sides.ca) {
      let [pmx, pmz] = Utils.VEC2_PROJECTION_COS([mx, mz], ca);
      return this.utilsMove(sectorIndex, x, z, pmx, pmz, i + 1);
    }
    else if (this.neighborPool[sectorIndex].s1 != -1 && sides.ab) {
      let nextSectorIndex = this.neighborPool[sectorIndex].s1;
      return this.utilsMove(nextSectorIndex, x, z, mx, mz, i + 1);
    }
    else if (this.neighborPool[sectorIndex].s2 != -1 && sides.bc) {
      let nextSectorIndex = this.neighborPool[sectorIndex].s2;
      return this.utilsMove(nextSectorIndex, x, z, mx, mz, i + 1);
    }
    else if (this.neighborPool[sectorIndex].s3 != -1 && sides.ca) {
      let nextSectorIndex = this.neighborPool[sectorIndex].s3;
      return this.utilsMove(nextSectorIndex, x, z, mx, mz, i + 1);
    }
  }

  utilsCreatePoint(x, z) {
    let point = new Point();
    let loc = this.utilsFindLocationInfo(x, z);
    point.sectorIndex = loc.sectorIndex;
    point.x = x;
    point.y = loc.elev;
    point.z = z;
    return point;
  }
}

module.exports.Gfx3JWM = Gfx3JWM;
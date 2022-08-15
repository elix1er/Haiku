(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let { eventManager } = require('./lib/core/event_manager');
let { inputManager } = require('./lib/input/input_manager');
let { gfx2TextureManager } = require('./lib/gfx2/gfx2_texture_manager');
let { Gfx2Drawable } = require('./lib/gfx2/gfx2_drawable');
let { Gfx2JAS } = require('./lib/gfx2_jas/gfx2_jas');
// ---------------------------------------------------------------------------------------

let DIRECTION = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD'
};

let DIRECTION_TO_VEC2 = {
  LEFT: [-1, 0],
  RIGHT: [1, 0],
  FORWARD: [0, -1],
  BACKWARD: [0, 1]
};

class Controller extends Gfx2Drawable {
  constructor() {
    super();
    this.jas = new Gfx2JAS();
    this.moving = false;
    this.direction = DIRECTION.FORWARD;
    this.speed = 2;
    this.width = 0;
    this.height = 0;
    this.collider1 = [0, 0];
    this.collider2 = [0, 0];
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    await this.jas.loadFromFile(json['JASFile']);
    this.jas.setTexture(await gfx2TextureManager.loadTexture(json['TextureFile']));
    this.jas.setOffset(json['OffsetX'], json['OffsetY']);
    this.width = json['Width'];
    this.height = json['Height'];
    this.collider1[0] = json['Collider1X'];
    this.collider1[1] = json['Collider1Y'];
    this.collider2[0] = json['Collider2X'];
    this.collider2[1] = json['Collider2Y'];
  }

  update(ts) {
    if (inputManager.isKeyDown('ArrowLeft')) {
      this.moving = true;
      this.direction = DIRECTION.LEFT;
    }
    else if (inputManager.isKeyDown('ArrowRight')) {
      this.moving = true;
      this.direction = DIRECTION.RIGHT;
    }
    else if (inputManager.isKeyDown('ArrowUp')) {
      this.moving = true;
      this.direction = DIRECTION.FORWARD;
    }
    else if (inputManager.isKeyDown('ArrowDown')) {
      this.moving = true;
      this.direction = DIRECTION.BACKWARD;
    }
    else {
      this.moving = false;
    }

    if (this.moving) {
      let prevPositionX = this.position[0];
      let prevPositionY = this.position[1];
      this.position[0] += DIRECTION_TO_VEC2[this.direction][0] * this.speed;
      this.position[1] += DIRECTION_TO_VEC2[this.direction][1] * this.speed;
      eventManager.emit(this, 'E_MOVED', { prevPositionX, prevPositionY });
    }

    this.jas.setPosition(this.position[0], this.position[1]);
    this.jas.play(this.moving ? 'RUN_' + this.direction : 'IDLE_' + this.direction, true, true);
    this.jas.update(ts);
  }

  draw() {
    this.jas.draw();
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getCollider1X() {
    return this.collider1[0];
  }

  getCollider1Y() {
    return this.collider1[1];
  }

  getCollider2X() {
    return this.collider2[0];
  }

  getCollider2Y() {
    return this.collider2[1];
  }
}

module.exports.Controller = Controller;
},{"./lib/core/event_manager":2,"./lib/gfx2/gfx2_drawable":5,"./lib/gfx2/gfx2_texture_manager":7,"./lib/gfx2_jas/gfx2_jas":8,"./lib/input/input_manager":11}],2:[function(require,module,exports){
let { EventSubscriber } = require('./event_subscriber');

class EventManager {
  constructor() {
    this.subscribers = [];
  }

  wait(emitter, type) {
    return new Promise(resolve => {
      this.subscribeOnce(emitter, type, this, (data) => {
        resolve(data);
      });
    });
  }

  subscribe(emitter, type, listener, cb) {
    if (!emitter) {
      throw new Error('EventManager::subscribe(): emitter is undefined !');
    }
    if (!type) {
      throw new Error('EventManager::subscribe(): type is undefined !');
    }
    if (!cb || typeof cb != 'function') {
      throw new Error('EventManager::subscribe(): cb is not a function !');
    }

    this.subscribers.push(new EventSubscriber(emitter, type, listener, false, cb));
  }

  subscribeOnce(emitter, type, listener, cb) {
    if (!emitter) {
      throw new Error('EventManager::subscribe(): emitter is undefined !');
    }
    if (!type) {
      throw new Error('EventManager::subscribe(): type is undefined !');
    }
    if (!cb || typeof cb != 'function') {
      throw new Error('EventManager::subscribe(): cb is not a function !');
    }

    this.subscribers.push(new EventSubscriber(emitter, type, listener, true, cb));
  }

  unsubscribe(emitter, type, listener) {
    for (let subscriber of this.subscribers) {
      if (subscriber.emitter == emitter && subscriber.type == type && subscriber.listener == listener) {
        this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        return;
      }
    }
  }

  unsubscribeAll() {
    this.subscribers = [];
  }

  async emit(emitter, type, data) {
    let promises = [];

    for (let subscriber of this.subscribers.slice()) {
      if (subscriber.emitter == emitter && subscriber.type == type) {
        let res = subscriber.cb.call(subscriber.listener, data);
        if (res instanceof Promise) {
          promises.push(res);
        }
  
        if (subscriber.once) {
          this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        }
      }
    }

    return Promise.all(promises);
  }
}

module.exports.eventManager = new EventManager();
},{"./event_subscriber":3}],3:[function(require,module,exports){
class EventSubscriber {
  constructor(emitter, type, listener, once, cb) {
    this.emitter = emitter;
    this.type = type;
    this.listener = listener;
    this.once = once;
    this.cb = cb;
  }
}

module.exports.EventSubscriber = EventSubscriber;
},{}],4:[function(require,module,exports){
// 
// Massive mathematics known-edge database
// http://www.faqs.org/faqs/graphics/algorithms-faq/
//

class Utils {
  static BIND(fn, ctx) {
    return fn.bind(ctx);
  }
  static BIND_1(fn, ctx, a) {
    return fn.bind(ctx, a);
  }

  static BIND_2(fn, ctx, a, b) {
    return fn.bind(ctx, a, b);
  }

  static BIND_3(fn, ctx, a, b, c) {
    return fn.bind(ctx, a, b, c);
  }

  static SHUFFLE(arr) {
    let res = arr.slice();
    let tmp, cur, tp = res.length;
    if (tp) {
      while (--tp) {
        cur = Math.floor(Math.random() * (tp + 1));
        tmp = res[cur];
        res[cur] = res[tp];
        res[tp] = tmp;
      }
    }

    return res;
  }

  static RANDARRAY(min, max) {
    let arr = [];
    for (let i = min; i <= max; i++) {
      arr.push(i);
    }

    return Utils.SHUFFLE(arr);
  }

  static GET_RANDOM_INT(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  static GET_RANDOM_FLOAT(min, max) {
    return (Math.random() * (max - min)) + min;
  }

  static CLAMP(a, b, c) {
    return Math.max(b, Math.min(c, a));
  }

  static DEG_TO_RAD(deg) {
    return deg * (Math.PI / 180);
  }

  static GET_TRIANGLE_ELEVATION(a, b, c, p = [0, 0]) {
    let ab = [b[0] - a[0], 0, b[2] - a[2]];
    let ca = [a[0] - c[0], 0, a[2] - c[2]];
    let ap = [p[0] - a[0], 0, p[1] - a[2]];
    let bp = [p[0] - b[0], 0, p[1] - b[2]];
    let cp = [p[0] - c[0], 0, p[1] - c[2]];

    let area = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(ab, ca));
    let wa = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(bp, cp)) / area;
    let wb = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(ap, cp)) / area;
    let wc = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(ap, bp)) / area;

    let total = Utils.TO_FIXED_NUMBER(wa + wb + wc, 5);
    if (total > 1) {
      return Infinity;
    }

    // pour finir, nous déterminons la coordonnée 'y' grâce aux poids precedemment trouvés.
    // celà est possible car : wa*HA + wb*HB = 0 et wa+wb*GH + wc*GC = 0.
    let vert = a[1] + ((b[1] - a[1]) * (wb / (wa + wb)));
    let elev = vert + ((c[1] - vert) * (wc / (wa + wb + wc)));
    return Utils.TO_FIXED_NUMBER(elev, 5);
  }

  static GET_TRIANGLE_SAME_SIDES(a, b, c, p) {
    let ab = [b[0] - a[0], 0, b[2] - a[2]];
    let bc = [c[0] - b[0], 0, c[2] - b[2]];
    let ca = [a[0] - c[0], 0, a[2] - c[2]];
    let ap = [p[0] - a[0], 0, p[1] - a[2]];
    let bp = [p[0] - b[0], 0, p[1] - b[2]];
    let cp = [p[0] - c[0], 0, p[1] - c[2]];
    let crossAPAB = Utils.VEC3_CROSS(ap, ab);
    let crossBPBC = Utils.VEC3_CROSS(bp, bc);
    let crossCPCA = Utils.VEC3_CROSS(cp, ca);
    return {
      ab: Utils.TO_FIXED_NUMBER(crossAPAB[1], 5) > 0,
      bc: Utils.TO_FIXED_NUMBER(crossBPBC[1], 5) > 0,
      ca: Utils.TO_FIXED_NUMBER(crossCPCA[1], 5) > 0
    }
  }

  static POINT_IN_TRIANGLE(a, b, c, p) {
    let sides = Utils.GET_TRIANGLE_SAME_SIDES(a, b, c, p);
    return !sides.ab && !sides.bc && !sides.ca;
  }

  static LERP(a, b, t) {
    return a + (b - a) * t;
  }

  static TO_FIXED_NUMBER(num, digits, base) {
    let pow = Math.pow(base || 10, digits);
    return Math.round(num * pow) / pow;
  }

  /**************************************************************************/

  static VEC2_CREATE(x = 0, y = 0) {
    return [x, y];
  }

  static VEC2_DISTANCE(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    return Math.sqrt((x * x) + (y * y));
  }

  static VEC2_LENGTH(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  }

  static VEC2_NORMALIZE(a) {
    let len = Utils.VEC2_LENGTH(a);
    if (len > 0) {
      let x = a[0] / len;
      let y = a[1] / len;
      return [x, y];
    }
    else {
      return [0, 0];
    }
  }

  static VEC2_DOT(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  static VEC2_ADD(a, b) {
    let x = a[0] + b[0];
    let y = a[1] + b[1];
    return [x, y];
  }

  static VEC2_SUBSTRACT(a, b) {
    let x = a[0] - b[0];
    let y = a[1] - b[1];
    return [x, y];
  }

  static VEC2_MULTIPLY(a, b) {
    let x = a[0] * b[0];
    let y = a[1] * b[1];
    return [x, y];
  }

  static VEC2_SCALE(a, scale) {
    let x = a[0] * scale;
    let y = a[1] * scale;
    return [x, y];
  }

  static VEC2_ANGLE_BETWEEN(a, b) {
    return Math.acos(Utils.VEC2_DOT(a, b) / (Utils.VEC2_LENGTH(a) * Utils.VEC2_LENGTH(b)));
  }

  static VEC2_ANGLE(a) {
    let angle = Math.atan2(a[1], a[0]);
    return (angle > 0) ? angle : (angle + Math.PI * 2);
  }

  static VEC2_ISEQUAL(a, b) {
    return a[0] == b[0] && a[1] == b[1];
  }

  static VEC2_PROJECTION_COS(a, b) {
    let bLength = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
    let bNormalizer = (a[0] * b[0] + a[1] * b[1]) / (bLength * bLength);
    let x = b[0] * bNormalizer;
    let y = b[1] * bNormalizer;
    return [x, y];
  }

  /**************************************************************************/

  static VEC3_ZERO = [0, 0, 0];
  static VEC3_BACKWARD = [0, 0, 1];
  static VEC3_FORWARD = [0, 0, -1];
  static VEC3_LEFT = [-1, 0, 0];
  static VEC3_RIGHT = [1, 0, 0];
  static VEC3_UP = [0, 1, 0];
  static VEC3_DOWN = [0, -1, 0];

  static VEC3_CREATE(x = 0, y = 0, z = 0) {
    return [x, y, z];
  }

  static VEC3_DISTANCE(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return Math.sqrt((x * x) + (y * y) + (z * z));
  }

  static VEC3_LENGTH(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  }

  static VEC3_NORMALIZE(a) {
    let len = Utils.VEC3_LENGTH(a);
    if (len > 0) {
      let x = a[0] / len;
      let y = a[1] / len;
      let z = a[2] / len;
      return [x, y, z];
    }
    else {
      return [0, 0, 0];
    }
  }

  static VEC3_DOT(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  static VEC3_CROSS(a, b) {
    let x = a[1] * b[2] - a[2] * b[1];
    let y = a[2] * b[0] - a[0] * b[2];
    let z = a[0] * b[1] - a[1] * b[0];
    return [x, y, z];
  }

  static VEC3_ADD(a, b) {
    let x = a[0] + b[0];
    let y = a[1] + b[1];
    let z = a[2] + b[2];
    return [x, y, z];
  }

  static VEC3_SUBSTRACT(a, b) {
    let x = a[0] - b[0];
    let y = a[1] - b[1];
    let z = a[2] - b[2];
    return [x, y, z];
  }

  static VEC3_MULTIPLY(a, b) {
    let x = a[0] * b[0];
    let y = a[1] * b[1];
    let z = a[2] * b[2];
    return [x, y, z];
  }

  static VEC3_SCALE(a, scale) {
    let x = a[0] * scale;
    let y = a[1] * scale;
    let z = a[2] * scale;
    return [x, y, z];
  }

  static VEC3_ISEQUAL(a, b) {
    return a[0] == b[0] && a[1] == b[1] && a[2] == b[2];
  }

  /**************************************************************************/

  static MAT3_MULTIPLY_BY_VEC3(a, v) {
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a10 = a[3];
    let a11 = a[4];
    let a12 = a[5];
    let a20 = a[6];
    let a21 = a[7];
    let a22 = a[8];
    let v00 = v[0];
    let v01 = v[1];
    let v02 = v[2];

    let c00 = v00 * a00 + v01 * a10 + v02 * a20;
    let c01 = v00 * a01 + v01 * a11 + v02 * a21;
    let c02 = v00 * a02 + v01 * a12 + v02 * a22;

    return [
      c00, c01, c02
    ];
  }

  static MAT3_MULTIPLY(a, b) {
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a10 = a[3];
    let a11 = a[4];
    let a12 = a[5];
    let a20 = a[6];
    let a21 = a[7];
    let a22 = a[8];
    let b00 = b[0];
    let b01 = b[1];
    let b02 = b[2];
    let b10 = b[3];
    let b11 = b[4];
    let b12 = b[5];
    let b20 = b[6];
    let b21 = b[7];
    let b22 = b[8];

    let c00 = b00 * a00 + b01 * a10 + b02 * a20;
    let c01 = b00 * a01 + b01 * a11 + b02 * a21;
    let c02 = b00 * a02 + b01 * a12 + b02 * a22;

    let c10 = b10 * a00 + b11 * a10 + b12 * a20;
    let c11 = b10 * a01 + b11 * a11 + b12 * a21;
    let c12 = b10 * a02 + b11 * a12 + b12 * a22;

    let c20 = b20 * a00 + b21 * a10 + b22 * a20;
    let c21 = b20 * a01 + b21 * a11 + b22 * a21;
    let c22 = b20 * a02 + b21 * a12 + b22 * a22;

    return [
      c00, c01, c02,
      c10, c11, c12,
      c20, c21, c22
    ];
  }

  static MAT3_INVERT(a) {
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a10 = a[3];
    let a11 = a[4];
    let a12 = a[5];
    let a20 = a[6];
    let a21 = a[7];
    let a22 = a[8];
    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      return null;
    }

    det = 1.0 / det;

    let out = [];
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;

    return out;
  }

  static MAT3_IDENTITY() {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
  }

  static MAT3_SCALE(x, y) {
    return [
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    ];
  }

  static MAT3_ROTATE(r) {
    let c = Math.cos(r);
    let s = Math.sin(r);
    return [
      c, s, 0,
      -s, c, 0,
      0, 0, 1
    ];
  }

  static MAT3_TRANSLATE(x, y) {
    return [
      1, 0, 0,
      0, 1, 0,
      x, y, 1
    ]
  }

  static MAT3_PROJECTION(w, h) {
    return [
      2 / w, 0, 0,
      0, 2 / h, 0,
      -1, -1, 1
    ];
  }

  /**************************************************************************/

  static MAT4_MULTIPLY_BY_VEC4(a, v) {
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a03 = a[3];
    let a10 = a[4];
    let a11 = a[5];
    let a12 = a[6];
    let a13 = a[7];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];
    let a30 = a[12];
    let a31 = a[13];
    let a32 = a[14];
    let a33 = a[15];
    let v00 = v[0];
    let v01 = v[1];
    let v02 = v[2];
    let v03 = v[3];

    let c00 = v00 * a00 + v01 * a10 + v02 * a20 + v03 * a30;
    let c01 = v00 * a01 + v01 * a11 + v02 * a21 + v03 * a31;
    let c02 = v00 * a02 + v01 * a12 + v02 * a22 + v03 * a32;
    let c03 = v00 * a03 + v01 * a13 + v02 * a23 + v03 * a33;

    return [
      c00, c01, c02, c03
    ];
  }

  static MAT4_COMPUTE(...matrices) {
    for (let i = 0; i < matrices.length - 1; i++) {
      matrices[i + 1] = Utils.MAT4_MULTIPLY(matrices[i], matrices[i + 1]);
    }

    return matrices[matrices.length - 1];
  }

  static MAT4_MULTIPLY(a, b) {
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a03 = a[3];
    let a10 = a[4];
    let a11 = a[5];
    let a12 = a[6];
    let a13 = a[7];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];
    let a30 = a[12];
    let a31 = a[13];
    let a32 = a[14];
    let a33 = a[15];
    let b00 = b[0];
    let b01 = b[1];
    let b02 = b[2];
    let b03 = b[3];
    let b10 = b[4];
    let b11 = b[5];
    let b12 = b[6];
    let b13 = b[7];
    let b20 = b[8];
    let b21 = b[9];
    let b22 = b[10];
    let b23 = b[11];
    let b30 = b[12];
    let b31 = b[13];
    let b32 = b[14];
    let b33 = b[15];

    let c00 = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    let c01 = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    let c02 = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    let c03 = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

    let c10 = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    let c11 = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    let c12 = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    let c13 = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

    let c20 = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    let c21 = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    let c22 = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    let c23 = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

    let c30 = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    let c31 = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    let c32 = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    let c33 = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return [
      c00, c01, c02, c03,
      c10, c11, c12, c13,
      c20, c21, c22, c23,
      c30, c31, c32, c33
    ];
  }

  static MAT4_INVERT(a) {
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a03 = a[3];
    let a10 = a[4];
    let a11 = a[5];
    let a12 = a[6];
    let a13 = a[7];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];
    let a30 = a[12];
    let a31 = a[13];
    let a32 = a[14];
    let a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }

    det = 1.0 / det;

    let out = [];
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
  }

  static MAT4_IDENTITY() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_SCALE(x, y, z) {
    return [
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_ROTATE_X(r) {
    let c = Math.cos(r);
    let s = Math.sin(r);
    return [
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_ROTATE_Y(r) {
    let c = Math.cos(r);
    let s = Math.sin(r);
    return [
      c, 0, s, 0,
      0, 1, 0, 0,
      -s, 0, c, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_ROTATE_Z(r) {
    let c = Math.cos(r);
    let s = Math.sin(r);
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_TRANSLATE(x, y, z) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]
  }

  static MAT4_TRANSFORM(position, rotation, scale) {
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(position[0], position[1], position[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(rotation[0]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(rotation[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(scale[0], scale[1], scale[2]));
    return matrix;
  }

  static MAT4_ORTHOGRAPHIC(size, depth) {
    return [
      2 / size, 0, 0, 0,
      0, 2 / size, 0, 0,
      0, 0, -2 / depth, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_PERSPECTIVE(fov, ar, near, far) {
    return [
      (1 / (Math.tan(fov / 2) * ar)), 0, 0, 0,
      0, 1 / Math.tan(fov / 2), 0, 0,
      0, 0, (near + far) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ];
  }

  static MAT4_LOOKAT(position, target, vertical = [0, 1, 0]) {
    let axeZ = Utils.VEC3_NORMALIZE(Utils.VEC3_SUBSTRACT(target, position));
    let axeX = Utils.VEC3_CROSS(vertical, axeZ);
    let axeY = Utils.VEC3_CROSS(axeZ, axeX);

    return [
      axeX[0], axeX[1], axeX[2], 0,
      axeY[0], axeY[1], axeY[2], 0,
      axeZ[0], axeZ[1], axeZ[2], 0,
      position[0], position[1], position[2], 1];
  }
}

module.exports.Utils = Utils;
},{}],5:[function(require,module,exports){
let { gfx2Manager } = require('./gfx2_manager');

class Gfx2Drawable {
  constructor() {
    this.position = [0, 0];
    this.rotation = 0;
    this.offset = [0, 0];
    this.visible = true;
  }

  getPosition() {
    return this.position;
  }

  getPositionX() {
    return this.position[0];
  }

  getPositionY() {
    return this.position[1];
  }

  setPosition(x, y) {
    this.position = [x, y];
  }

  getRotation() {
    return this.rotation;
  }

  setRotation(rotation) {
    this.rotation = rotation;
  }

  getOffset() {
    return this.offset;
  }

  getOffsetX() {
    return this.offset[0];
  }

  getOffsetY() {
    return this.offset[1];
  }

  setOffset(x, y) {
    this.offset = [x, y];
  }

  isVisible() {
    return this.visible;
  }

  setVisible(visible) {
    this.visible = visible;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw(ts) {
    if (!this.visible) {
      return;
    }

    let ctx = gfx2Manager.getContext();

    ctx.save();
    ctx.translate(-this.offset[0], -this.offset[1]);
    ctx.translate(this.position[0], this.position[1]);
    ctx.rotate(this.rotation);
    this.paint(ts);
    ctx.restore();
  }

  paint(ts) {
    // virtual method called during draw phase !
  }
}

module.exports.Gfx2Drawable = Gfx2Drawable;
},{"./gfx2_manager":6}],6:[function(require,module,exports){
class Gfx2Manager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.cameraPosition = [0, 0];
    this.bgColor = [0, 0, 0, 1];

    this.canvas = document.getElementById('CANVAS_2D');
    if (!this.canvas) {
      throw new Error('Gfx2Manager::Gfx2Manager: CANVAS_2D not found');
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Gfx2Manager::Gfx2Manager: Your browser not support 2D');
    }
  }

  update(ts) {
    if (this.canvas.width != this.canvas.clientWidth || this.canvas.height != this.canvas.clientHeight) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
    }
  }

  beginDrawing() {
    this.ctx.restore();
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = `rgba(${this.bgColor[0]}, ${this.bgColor[1]}, ${this.bgColor[2]}, ${this.bgColor[3]})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.translate(-this.cameraPosition[0] + this.canvas.width * 0.5, -this.cameraPosition[1] + this.canvas.height * 0.5);
  }

  endDrawing() {}

  moveCamera(x, y) {
    this.cameraPosition[0] += x;
    this.cameraPosition[1] += y;
  }

  findCanvasFromClientPosition(clientX, clientY) {
    let rect = this.canvas.getBoundingClientRect();
    let x = clientX - rect.x;
    let y = clientY - rect.y;
    return [x, y];
  }

  findWorldFromClientPosition(clientX, clientY) {
    let rect = this.canvas.getBoundingClientRect();
    let x = (clientX - rect.x) + this.cameraPosition[0] - this.canvas.width * 0.5;
    let y = (clientY - rect.y) + this.cameraPosition[1] - this.canvas.height * 0.5;
    return [x, y];
  }

  getWidth() {
    return this.canvas.clientWidth;
  }

  getHeight() {
    return this.canvas.clientHeight;
  }

  getContext() {
    return this.ctx;
  }

  setCameraPosition(x, y) {
    this.cameraPosition[0] = x;
    this.cameraPosition[1] = y;
  }

  getCameraPosition() {
    return this.cameraPosition;
  }

  getCameraPositionX() {
    return this.cameraPosition[0];
  }

  getCameraPositionY() {
    return this.cameraPosition[1];
  }
}

module.exports.gfx2Manager = new Gfx2Manager();
},{}],7:[function(require,module,exports){
class Gfx2TextureManager {
  constructor() {
    this.textures = {};
  }

  async loadTexture(path) {
    if (this.textures[path]) {
      return this.textures[path];
    }

    let res = await fetch(path);
    let img = await res.blob();
    let bitmap = await createImageBitmap(img);
    this.textures[path] = bitmap;
    return bitmap;
  }

  deleteTexture(path) {
    if (!this.textures[path]) {
      throw new Error('Gfx2TextureManager::deleteTexture(): The texture file doesn\'t exist, cannot delete !');
    }

    this.textures[path] = null;
    delete this.textures[path];
  }

  getTexture(path) {
    if (!this.textures[path]) {
      throw new Error('Gfx2TextureManager::getTexture(): The texture file doesn\'t exist, cannot get !');
    }

    return this.textures[path];
  }

  getDefaultTexture() {
    let image = new Image();
    image.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    return image;
  }

  releaseTextures() {
    for (let path in this.textures) {
      this.textures[path] = null;
      delete this.textures[path];
    }
  }
}

module.exports.gfx2TextureManager = new Gfx2TextureManager();
},{}],8:[function(require,module,exports){
let { eventManager } = require('../core/event_manager');
let { Gfx2Drawable } = require('../gfx2/gfx2_drawable');
let { gfx2Manager } = require('../gfx2/gfx2_manager');
let { gfx2TextureManager } = require('../gfx2/gfx2_texture_manager');

class JASFrame {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }
}

class JASAnimation {
  constructor() {
    this.name = '';
    this.frames = [];
    this.frameDuration = 0;
  }
}

class Gfx2JAS extends Gfx2Drawable {
  constructor() {
    super();
    this.animations = [];
    this.texture = gfx2TextureManager.getDefaultTexture();
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = false;
    this.frameProgress = 0;
  }

  getTexture() {
    return this.texture;
  }

  setTexture(texture) {
    this.texture = texture;
  }

  update(ts) {
    if (!this.currentAnimation) {
      return;
    }

    if (this.frameProgress >= this.currentAnimation.frameDuration) {
      if (this.currentAnimationFrameIndex == this.currentAnimation.frames.length - 1) {
        eventManager.emit(this, 'E_FINISHED');
        this.currentAnimationFrameIndex = this.isLooped ? 0 : this.currentAnimation.frames.length - 1;
        this.frameProgress = 0;
      }
      else {
        this.currentAnimationFrameIndex = this.currentAnimationFrameIndex + 1;
        this.frameProgress = 0;
      }
    }
    else {
      this.frameProgress += ts;
    }
  }

  paint(ts) {
    if (!this.currentAnimation) {
      return;
    }

    let ctx = gfx2Manager.getContext();
    let currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];

    ctx.drawImage(
      this.texture,
      currentFrame.x,
      currentFrame.y,
      currentFrame.width,
      currentFrame.height,
      0,
      0,
      currentFrame.width,
      currentFrame.height
    );
  }

  play(animationName, isLooped = false, preventSameAnimation = false) {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    let animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx2JAS::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.isLooped = isLooped;
    this.frameProgress = 0;
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    this.animations = [];
    for (let obj of json['Animations']) {
      let animation = new JASAnimation();
      animation.name = obj['Name'];
      animation.frameDuration = parseInt(obj['FrameDuration']);

      for (let objFrame of obj['Frames']) {
        let frame = new JASFrame();
        frame.x = objFrame['X'];
        frame.y = objFrame['Y'];
        frame.width = objFrame['Width'];
        frame.height = objFrame['Height'];
        animation.frames.push(frame);
      }

      this.animations.push(animation);
    }

    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.frameProgress = 0;
  }
}

module.exports.Gfx2JAS = Gfx2JAS;
},{"../core/event_manager":2,"../gfx2/gfx2_drawable":5,"../gfx2/gfx2_manager":6,"../gfx2/gfx2_texture_manager":7}],9:[function(require,module,exports){
let { gfx2TextureManager } = require('../gfx2/gfx2_texture_manager');

class Gfx2Map {
  constructor() {
    this.rows = 0;
    this.columns = 0;
    this.tileHeight = 0;
    this.tileWidth = 0;
    this.tileLayers = [];
    this.tileset = new Gfx2Tileset();
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    this.rows = json['Rows'];
    this.columns = json['Columns'];
    this.tileHeight = json['TileHeight'];
    this.tileWidth = json['TileWidth'];

    this.tileLayers = [];
    for (let obj of json['Layers']) {
      let tileLayer = new Gfx2TileLayer();
      await tileLayer.loadFromData(obj);
      this.tileLayers.push(tileLayer);
    }

    this.tileset = new Gfx2Tileset();

    if (json['Tileset']) {
      await this.tileset.loadFromData(json['Tileset']);
    }
  }

  getHeight() {
    return this.rows * this.tileHeight;
  }

  getWidth() {
    return this.columns * this.tileWidth;
  }

  getRows() {
    return this.rows;
  }

  getColumns() {
    return this.columns;
  }

  getTileHeight() {
    return this.tileHeight;
  }

  getTileWidth() {
    return this.tileWidth;
  }

  getTileLayer(index) {
    return this.tileLayers[index];
  }

  findTileLayer(name) {
    return this.tileLayers.find(tileLayer => tileLayer.getName() == name);
  }

  getTileset() {
    return this.tileset;
  }

  getPositionX(col) {
    return col * this.tileWidth;
  }

  getPositionY(row) {
    return row * this.tileHeight;
  }

  getLocationCol(x) {
    return Math.floor(x / this.tileWidth);
  }

  getLocationRow(y) {
    return Math.floor(y / this.tileHeight);
  }
}

class Gfx2TileLayer {
  constructor() {
    this.name = '';
    this.rows = 0;
    this.columns = 0;
    this.visible = true;
    this.frameDuration = 0;
    this.grid = [];
  }

  async loadFromData(data) {
    this.name = data['Name'];
    this.rows = data['Rows'];
    this.columns = data['Columns'];
    this.visible = data['Visible'];
    this.frameDuration = data['FrameDuration'];
    this.grid = data['Grid'];
  }

  getTile(col, row) {
    return this.grid[col + (row * this.columns)];
  }

  getName() {
    return this.name;
  }

  getRows() {
    return this.rows;
  }

  getColumns() {
    return this.columns;
  }

  isVisible() {
    return this.visible;
  }

  getFrameDuration() {
    return this.frameDuration;
  }

  getGrid() {
    return this.grid;
  }
}

class Gfx2Tileset {
  constructor() {
    this.columns = 0;
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.texture = gfx2TextureManager.getDefaultTexture();
    this.animations = {};
  }

  async loadFromData(data) {
    this.columns = parseInt(data['Columns']);
    this.tileWidth = parseInt(data['TileWidth']);
    this.tileHeight = parseInt(data['TileHeight']);
    this.texture = await gfx2TextureManager.loadTexture(data['TextureFile']);

    this.animations = {};
    for (let tileId in data['Animations']) {
      this.animations[tileId] = data['Animations'][tileId] ?? [];
    }
  }

  getTilePositionX(tileId) {
    return ((tileId - 1) % this.columns) * this.tileWidth;
  }

  getTilePositionY(tileId) {
    return Math.floor((tileId - 1) / this.columns) * this.tileHeight;
  }

  getTileHeight() {
    return this.tileHeight;
  }

  getTileWidth() {
    return this.tileWidth;
  }

  getColumns() {
    return this.columns;
  }

  getTexture() {
    return this.texture;
  }

  getAnimation(tileId) {
    return this.animations[tileId];
  }
}

module.exports.Gfx2Map = Gfx2Map;
},{"../gfx2/gfx2_texture_manager":7}],10:[function(require,module,exports){
let { Gfx2Drawable } = require('../gfx2/gfx2_drawable');
let { gfx2Manager } = require('../gfx2/gfx2_manager');

class Gfx2MapLayer extends Gfx2Drawable {
  constructor(map, layerIndex) {
    super();
    this.map = map;
    this.layerIndex = layerIndex;
    this.frame = 0;
    this.frameProgress = 0;
  }

  update(ts) {
    let layer = this.map.getTileLayer(this.layerIndex);
    if (!layer) {
      return;
    }

    if (this.frameProgress > layer.getFrameDuration()) {
      this.frame = this.frame + 1;
      this.frameProgress = 0;
    }

    this.frameProgress += ts;
  }

  paint(ts) {
    let layer = this.map.getTileLayer(this.layerIndex);
    if (!layer) {
      return;
    }
    if (!layer.isVisible()) {
      return;
    }

    let ctx = gfx2Manager.getContext();
    let tileset = this.map.getTileset();

    for (let col = 0; col < layer.getColumns(); col++) {
      for (let row = 0; row < layer.getRows(); row++) {
        let tileId = layer.getTile(col, row);
        if (tileset.getAnimation(tileId)) {
          let animation = tileset.getAnimation(tileId);
          tileId = animation[this.frame % animation.length];
        }
  
        ctx.drawImage(
          tileset.getTexture(),
          tileset.getTilePositionX(tileId),
          tileset.getTilePositionY(tileId),
          tileset.getTileWidth(),
          tileset.getTileHeight(),
          Math.round(col * this.map.getTileWidth()),
          Math.round(row * this.map.getTileHeight()),
          this.map.getTileWidth(),
          this.map.getTileHeight()
        );
      }
    }
  }
}

module.exports.Gfx2MapLayer = Gfx2MapLayer;
},{"../gfx2/gfx2_drawable":5,"../gfx2/gfx2_manager":6}],11:[function(require,module,exports){
class InputManager {
  constructor() {
    this.keymap = {};
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  isKeyDown(key) {
    return this.keymap[key];
  }

  handleKeyDown(e) {
    this.keymap[e.key] = true;
  }

  handleKeyUp(e) {
    this.keymap[e.key] = false;
  }
}

module.exports.inputManager = new InputManager();
},{}],12:[function(require,module,exports){
class Screen {
  constructor(app) {
    this.app = app;
    this.blocking = true;
  }

  setBlocking(blocking) {
    this.blocking = blocking;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw() {
    // virtual method called during draw phase !
  }

  async onEnter(args) {
    // virtual method called during enter phase !
  }

  async onExit() {
    // virtual method called during exit phase !
  }

  onBringToFront() {
    // virtual method called when get the top state level !
  }

  onBringToBack() {
    // virtual method called when lost the top state level !
  }
}

module.exports.Screen = Screen;
},{}],13:[function(require,module,exports){
class ScreenManager {
  constructor() {
    this.requests = [];
    this.screens = [];
  }

  update(ts) {
    while (this.requests.length > 0) {
      let request = this.requests.pop();
      request();
    }

    for (let i = this.screens.length - 1; i >= 0; i--) {
      this.screens[i].update(ts);
      if (this.screens[i].blocking) {
        return;
      }
    }
  }

  draw() {
    for (let i = this.screens.length - 1; i >= 0; i--) {
      this.screens[i].draw();
      if (this.screens[i].blocking) {
        return;
      }
    }
  }

  requestPushScreen(newTopScreen, args = {}) {
    this.requests.push(() => {
      if (this.screens.indexOf(newTopScreen) != -1) {
        throw new Error('ScreenManager::requestPushScreen(): You try to push an existing screen to the stack !');
      }

      let topScreen = this.screens[this.screens.length - 1];
      topScreen.onBringToBack(newTopScreen);

      let promise = newTopScreen.onEnter(args);
      promise.then(() => this.screens.push(newTopScreen));
    });
  }

  requestSetScreen(newScreen, args = {}) {
    this.requests.push(() => {
      this.screens.forEach(screen => screen.onExit());
      this.screens = [];
      let promise = newScreen.onEnter(args);
      promise.then(() => this.screens.push(newScreen));
    });
  }

  requestPopScreen() {
    this.requests.push(() => {
      if (this.screens.length == 0) {
        throw new Error('ScreenManager::requestPopScreen: You try to pop an empty state stack !');
      }

      let topScreen = this.screens[this.screens.length - 1];
      topScreen.onExit();
      this.screens.pop();

      if (this.screens.length > 0) {
        let newTopScreen = this.screens[this.screens.length - 1];
        newTopScreen.onBringToFront(topScreen);
      }
    });
  }
}

module.exports.screenManager = new ScreenManager();
},{}],14:[function(require,module,exports){
window.addEventListener('load', async () => {
  let { screenManager } = require('./lib/screen/screen_manager');
  let { gfx2Manager } = require('./lib/gfx2/gfx2_manager');
  let { MainScreen } = require('./main_screen');

  let then = Date.now();
  screenManager.requestSetScreen(new MainScreen());
  run();

  function run(timeStamp = Date.now()) {
    let ts = timeStamp - then;
    then = timeStamp;
  
    screenManager.update(ts);
    gfx2Manager.update(ts);

    gfx2Manager.beginDrawing();
    screenManager.draw();
    gfx2Manager.endDrawing();
  
    requestAnimationFrame(timeStamp => run(timeStamp));
  }
});
},{"./lib/gfx2/gfx2_manager":6,"./lib/screen/screen_manager":13,"./main_screen":15}],15:[function(require,module,exports){
let { eventManager } = require('./lib/core/event_manager');
let { gfx2Manager } = require('./lib/gfx2/gfx2_manager');
let { Utils } = require('./lib/core/utils');
let { Screen } = require('./lib/screen/screen');
let { Gfx2Map } = require('./lib/gfx2_map/gfx2_map');
let { Gfx2MapLayer } = require('./lib/gfx2_map/gfx2_map_layer');
// ---------------------------------------------------------------------------------------
let { Controller } = require('./controller');
// ---------------------------------------------------------------------------------------

const LAYER = {
  BACKGROUND: 0,
  MIDDLE: 1,
  FOREGROUND: 2
};

class MainScreen extends Screen {
  constructor() {
    super();
    this.map = new Gfx2Map();
    this.collisionMap = new Gfx2Map();
    this.layerBackground = new Gfx2MapLayer(this.map, LAYER.BACKGROUND);
    this.layerMiddle = new Gfx2MapLayer(this.map, LAYER.MIDDLE);
    this.layerForeground = new Gfx2MapLayer(this.map, LAYER.FOREGROUND);
    this.controller = new Controller();
  }

  async onEnter() {
    await this.map.loadFromFile('./assets/tilemaps/cave/map.json');
    await this.collisionMap.loadFromFile('./assets/tilemaps/cave/collision.json');
    await this.controller.loadFromFile('./assets/controllers/bernard/data.json');
    this.controller.setPosition(this.collisionMap.getPositionX(12), this.collisionMap.getPositionY(16));

    eventManager.subscribe(this.controller, 'E_MOVED', this, this.handleControllerMoved);
  }

  update(ts) {
    let cameraMinX = gfx2Manager.getWidth() * 0.5;
    let cameraMaxX = this.map.getWidth() - gfx2Manager.getWidth() * 0.5;
    let cameraMinY = gfx2Manager.getHeight() * 0.5;
    let cameraMaxY = this.map.getHeight() - gfx2Manager.getHeight() * 0.5;

    gfx2Manager.setCameraPosition(
      Utils.CLAMP(this.controller.getPositionX(), cameraMinX, cameraMaxX),
      Utils.CLAMP(this.controller.getPositionY(), cameraMinY, cameraMaxY)
    );

    this.layerBackground.update(ts);
    this.layerMiddle.update(ts);
    this.controller.update(ts);
    this.layerForeground.update(ts);
  }

  draw() {
    this.layerBackground.draw();
    this.layerMiddle.draw();
    this.controller.draw();
    this.layerForeground.draw();
  }

  handleControllerMoved({ prevPositionX, prevPositionY }) {
    let position = this.controller.getPosition();
    let collisionLayer = this.collisionMap.getTileLayer(0);
    if (!collisionLayer) {
      return;
    }

    let loc00X = this.collisionMap.getLocationCol(position[0] + this.controller.getCollider1X());
    let loc00Y = this.collisionMap.getLocationCol(position[1] + this.controller.getCollider1Y());
    let loc01X = this.collisionMap.getLocationCol(position[0] + this.controller.getCollider2X());
    let loc01Y = this.collisionMap.getLocationCol(position[1] + this.controller.getCollider2Y());

    if (collisionLayer.getTile(loc00X, loc00Y) == 1 || collisionLayer.getTile(loc01X, loc01Y) == 1) {
      this.controller.setPosition(prevPositionX, prevPositionY);
    }
  }
}

module.exports.MainScreen = MainScreen;
},{"./controller":1,"./lib/core/event_manager":2,"./lib/core/utils":4,"./lib/gfx2/gfx2_manager":6,"./lib/gfx2_map/gfx2_map":9,"./lib/gfx2_map/gfx2_map_layer":10,"./lib/screen/screen":12}]},{},[14]);

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
let { Utils } = require('./lib/core/utils');
let { ProjectionModeEnum } = require('./lib/gfx3/gfx3_view');
// ---------------------------------------------------------------------------------------

class Camera {
  constructor() {
    this.targetDrawable = null;
    this.minClipOffset = [0, 0];
    this.maxClipOffset = [0, 0];
    this.view = gfx3Manager.getView(0);

    this.view.setProjectionMode(ProjectionModeEnum.PERSPECTIVE);
    gfx3Manager.setShowDebug(true);
  }

  async loadFromData(data) {
    this.minClipOffset[0] = data['MinClipOffsetX'];
    this.minClipOffset[1] = data['MinClipOffsetY'];
    this.maxClipOffset[0] = data['MaxClipOffsetX'];
    this.maxClipOffset[1] = data['MaxClipOffsetY'];
    this.view.setCameraMatrix(data['Matrix']);
    this.view.setPerspectiveFovy(Utils.DEG_TO_RAD(parseInt(data['Fovy'])));
  }

  update(ts) {
    if (!this.targetDrawable) {
      return;
    }

    let clipOffset = this.view.getClipOffset();
    let targetWorldPosition = this.targetDrawable.getPosition();
    let targetScreenPosition = gfx3Manager.getScreenPosition(0, targetWorldPosition[0], targetWorldPosition[1], targetWorldPosition[2]);

    this.view.setClipOffset(
      Utils.CLAMP(targetScreenPosition[0] + clipOffset[0], this.minClipOffset[0], this.maxClipOffset[0]),
      Utils.CLAMP(targetScreenPosition[1] + clipOffset[1], this.minClipOffset[1], this.maxClipOffset[1])
    );
  }

  setTargetDrawable(targetDrawable) {
    this.targetDrawable = targetDrawable;
  }
}

module.exports.Camera = Camera;
},{"./lib/core/utils":5,"./lib/gfx3/gfx3_manager":8,"./lib/gfx3/gfx3_view":12}],2:[function(require,module,exports){
let { eventManager } = require('./lib/core/event_manager');
let { inputManager } = require('./lib/input/input_manager');
let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Utils } = require('./lib/core/utils');
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3JAM } = require('./lib/gfx3_jam/gfx3_jam');
// ---------------------------------------------------------------------------------------

class Controller extends Gfx3Drawable {
  constructor() {
    super();
    this.jam = new Gfx3JAM();
    this.controllable = true;
    this.radius = 0;
    this.speed = 4;
  }

  async loadFromData(data) {
    await this.jam.loadFromFile(data['JAMFile']);
    this.jam.setTexture(await gfx3TextureManager.loadTexture(data['TextureFile']));
    this.radius = data['Radius'];
  }

  update(ts) {
    let moving = false;
    if (this.controllable) {
      let moveDir = Utils.VEC3_ZERO;
      if (inputManager.isKeyDown('ArrowLeft')) {
        moveDir = Utils.VEC3_LEFT;
        moving = true;
      }
      else if (inputManager.isKeyDown('ArrowRight')) {
        moveDir = Utils.VEC3_RIGHT;
        moving = true;
      }
      else if (inputManager.isKeyDown('ArrowUp')) {
        moveDir = Utils.VEC3_FORWARD;
        moving = true;
      }
      else if (inputManager.isKeyDown('ArrowDown')) {
        moveDir = Utils.VEC3_BACKWARD;
        moving = true;
      }
  
      if (moving) {
        let moveX = moveDir[0] * this.speed * (ts / 1000);
        let moveZ = moveDir[2] * this.speed * (ts / 1000);
        this.position[0] += moveX;
        this.position[2] += moveZ;
        this.rotation[1] = Utils.VEC2_ANGLE([moveDir[0], moveDir[2]]);
        eventManager.emit(this, 'E_MOVED', { moveX, moveZ });
      }
    }

    this.jam.setPosition(this.position[0], this.position[1], this.position[2]);
    this.jam.setRotation(this.rotation[0], this.rotation[1], this.rotation[2]);
    this.jam.play(moving ? 'RUN' : 'IDLE', true, true);
    this.jam.update(ts);
  }

  draw() {
    this.jam.draw();
  }

  handleKeyDownOnce(e) {
    if (!this.controllable) {
      return;
    }

    if (e.key == 'Enter') {
      let handPositionX = this.position[0] + Math.cos(this.rotation[1]) * this.radius + 0.5;
      let handPositionY = this.position[1];
      let handPositionZ = this.position[2] + Math.sin(this.rotation[1]) * this.radius + 0.5;
      eventManager.emit(this, 'E_ACTION', { handPositionX, handPositionY, handPositionZ });
    }
  }

  setControllable(controllable) {
    this.controllable = controllable;
  }

  getRadius() {
    return this.radius;
  }
}

module.exports.Controller = Controller;
},{"./lib/core/event_manager":3,"./lib/core/utils":5,"./lib/gfx3/gfx3_drawable":7,"./lib/gfx3/gfx3_texture_manager":11,"./lib/gfx3_jam/gfx3_jam":14,"./lib/input/input_manager":17}],3:[function(require,module,exports){
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
},{"./event_subscriber":4}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
class Utils {
  static FAIL(message) {
    let elem = document.querySelector('#APP_FAIL');
    elem.classList.add('SHOW');
    elem.textContent = message;
  }

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
},{}],6:[function(require,module,exports){
let { gfx3Manager } = require('./gfx3_manager');

class Gfx3Debug {
  static drawGrid(modelMatrix, extend = 3, spacing = 1) {
    let vertices = [];
    let vertexCount = 0;
    let nbCells = extend * 2;
    let gridSize = nbCells * spacing;
    let left = -gridSize * 0.5;
    let top = -gridSize * 0.5;

    for (let i = 0; i <= nbCells; i++) {
      let vLineFromX = left + (i * spacing);
      let vLineFromY = top;
      let vLineFromZ = 0;
      let vLineDestX = left + (i * spacing);
      let vLineDestY = top + gridSize;
      let vLineDestZ = 0;
      let hLineFromX = left;
      let hLineFromY = top + (i * spacing);
      let hLineFromZ = 0;
      let hLineDestX = left + gridSize;
      let hLineDestY = top + (i * spacing);
      let hLineDestZ = 0;
      vertices.push(vLineFromX, vLineFromY, vLineFromZ, 1, 1, 1);
      vertices.push(vLineDestX, vLineDestY, vLineDestZ, 1, 1, 1);
      vertices.push(hLineFromX, hLineFromY, hLineFromZ, 1, 1, 1);
      vertices.push(hLineDestX, hLineDestY, hLineDestZ, 1, 1, 1);
      vertexCount += 4;
    }

    gfx3Manager.drawDebugLineList(modelMatrix, vertexCount, vertices);
  }

  static drawGizmo(modelMatrix, size = 1) {
    let vertices = [];
    let vertexCount = 0;
    let axes = [
      [1 * size, 0, 0],
      [0, 1 * size, 0],
      [0, 0, 1 * size]
    ];

    let colors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];

    for (let i = 0; i < axes.length; i++) {
      vertices.push(0, 0, 0, colors[i][0], colors[i][1], colors[i][2]);
      vertices.push(axes[i][0], axes[i][1], axes[i][2], colors[i][0], colors[i][1], colors[i][2]);
      vertexCount += 2;
    }

    gfx3Manager.drawDebugLineList(modelMatrix, vertexCount, vertices);
  }

  static drawCircle(modelMatrix, radius = 1, step = 4) {
    let vertices = [];
    let vertexCount = 0;
    let angleStep = (Math.PI * 2) / step;

    for (let i = 0; i < step; i++) {
      let x1 = Math.cos(i * angleStep) * radius;
      let y1 = Math.sin(i * angleStep) * radius;
      let z1 = 0;
      let x2 = Math.cos((i + 1) * angleStep) * radius;
      let y2 = Math.sin((i + 1) * angleStep) * radius;
      let z2 = 0;

      vertices.push(x1, y1, z1, 1, 1, 1);
      vertices.push(x2, y2, z2, 1, 1, 1);
      vertexCount += 2;
    }

    gfx3Manager.drawDebugLineList(modelMatrix, vertexCount, vertices);
  }

  static drawBoundingRect(modelMatrix, min, max) {
    let vertices = [];
    let vertexCount = 0;
    let a = [min[0], min[1], 0];
    let b = [min[0], max[1], 0];
    let c = [max[0], min[1], 0];
    let d = [max[0], max[1], 0];

    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertexCount += 2;
    /* -- */
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertexCount += 2;
    /* -- */
    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertexCount += 2;
    /* -- */
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertexCount += 2;

    gfx3Manager.drawDebugLineList(modelMatrix, vertexCount, vertices);
  }

  static drawSphere(modelMatrix, radius = 1, step = 4) {
    let vertices = [];
    let vertexCount = 0;
    let angleStep = (Math.PI * 0.5) / step;
    let points = [];

    for (let i = -step; i <= step; i++) {
      let r = Math.cos(i * angleStep) * radius;
      let y = Math.sin(i * angleStep) * radius;
      for (let j = 0; j <= step * 4; j++) {
        let z = Math.sin(j * angleStep) * r;
        let x = Math.cos(j * angleStep) * Math.cos(i * angleStep) * radius;
        points.push([x, y, z]);
      }
    }

    for (let i = -step; i <= step; i++) {
      for (let j = 0; j <= step * 4; j++) {
        let x = Math.cos(j * angleStep) * radius * Math.cos(i * angleStep);
        let y = Math.sin(j * angleStep) * radius;
        let z = Math.cos(j * angleStep) * radius * Math.sin(i * angleStep);
        points.push([x, y, z]);
      }
    }

    for (let i = 0; i < points.length - 1; i++) {
      vertices.push(points[i][0], points[i][1], points[i][2], 1, 1, 1);
      vertices.push(points[i + 1][0], points[i + 1][1], points[i + 1][2], 1, 1, 1);
      vertexCount += 2;
    }

    gfx3Manager.drawDebugLineList(modelMatrix, vertexCount, vertices);
  }

  static drawBoundingBox(modelMatrix, min, max) {
    let vertices = [];
    let vertexCount = 0;
    let a = [min[0], min[1], min[2]];
    let b = [max[0], min[1], min[2]];
    let c = [max[0], max[1], min[2]];
    let d = [min[0], max[1], min[2]];
    let e = [min[0], max[1], max[2]];
    let f = [max[0], max[1], max[2]];
    let g = [max[0], min[1], max[2]];
    let h = [min[0], min[1], max[2]];

    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(h[0], h[1], h[2], 1, 1, 1);
    vertices.push(g[0], g[1], g[2], 1, 1, 1);
    vertexCount += 4;
    /* -- */
    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(e[0], e[1], e[2], 1, 1, 1);
    vertices.push(f[0], f[1], f[2], 1, 1, 1);
    vertexCount += 4;
    /* -- */
    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(h[0], h[1], h[2], 1, 1, 1);
    vertices.push(e[0], e[1], e[2], 1, 1, 1);
    vertexCount += 4;
    /* -- */
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(g[0], g[1], g[2], 1, 1, 1);
    vertices.push(f[0], f[1], f[2], 1, 1, 1);
    vertexCount += 4;
    /* -- */
    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(e[0], e[1], e[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(f[0], f[1], f[2], 1, 1, 1);
    vertexCount += 4;
    /* -- */
    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(h[0], h[1], h[2], 1, 1, 1);
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(g[0], g[1], g[2], 1, 1, 1);
    vertexCount += 4;

    gfx3Manager.drawDebugLineList(modelMatrix, vertexCount, vertices);
  }
}

module.exports.Gfx3Debug = Gfx3Debug;
},{"./gfx3_manager":8}],7:[function(require,module,exports){
let { Utils } = require('../core/utils');

class Gfx3Drawable {
  constructor() {
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.vertices = [];
    this.vertexCount = 0;
    this.previousVertexCount = 0;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw(viewIndex) {
    // virtual method called during draw phase !
  }

  delete() {
    this.vertexBuffer.destroy();
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

  getPositionZ() {
    return this.position[2];
  }

  setPosition(x, y, z) {
    this.position = [x, y, z];
  }

  move(x, y, z) {
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
  }

  getRotation() {
    return this.rotation;
  }

  getRotationX() {
    return this.rotation[0];
  }

  getRotationY() {
    return this.rotation[1];
  }

  getRotationZ() {
    return this.rotation[2];
  }

  setRotation(x, y, z) {
    this.rotation = [x, y, z];
  }

  rotate(x, y, z) {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
  }

  getScale() {
    return this.scale;
  }

  getScaleX() {
    return this.scale[0];
  }

  getScaleY() {
    return this.scale[1];
  }

  getScaleZ() {
    return this.scale[2];
  }

  setScale(x, y, z) {
    this.scale = [x, y, z];
  }

  zoom(x, y, z) {
    this.scale[0] += x;
    this.scale[1] += y;
    this.scale[2] += z;
  }

  defineVertex(x, y, z, tx, ty) {
    this.vertices.push(x, y, z, tx, ty);
    this.vertexCount++;
  }

  defineVertexColor(x, y, z, r, g, b) {
    this.vertices.push(x, y, z, r, g, b);
    this.vertexCount++;
  }

  clearVertices() {
    this.vertices = [];
    this.vertexCount = 0;
  }

  commitVertices() {
    this.previousVertexCount = this.vertexCount;
  }

  getModelMatrix() {
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(this.rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(this.rotation[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
    return matrix;
  }
}

module.exports.Gfx3Drawable = Gfx3Drawable;
},{"../core/utils":5}],8:[function(require,module,exports){
let { Utils } = require('../core/utils');
let { Gfx3View } = require('./gfx3_view');
let { Gfx3Texture } = require('./gfx3_texture');
let { CREATE_MESH_SHADER_RES, CREATE_DEBUG_SHADER_RES } = require('./gfx3_shaders');

let CMD_MATRIX_BUFFER_DATA = 0;
let CMD_MATRIX_BUFFER_OFFSET = 1;
let CMD_VERTEX_BUFFER_DATA = 2;
let CMD_VERTEX_BUFFER_SIZE = 3;
let CMD_VERTEX_COUNT = 4;
let CMD_VERTEX_BUFFER_OFFSET = 5;
let CMD_TEXTURE_GROUP = 6;

class Gfx3Manager {
  constructor() {
    this.adapter = null;
    this.device = null;
    this.canvas = null;
    this.ctx = null;
    this.depthTexture = null;
    this.depthView = null;

    this.meshPipeline = null;
    this.meshVertexBuffer = null;
    this.meshMatrixBuffer = null;
    this.meshCommands = [];
    this.meshVertexCount = 0;

    this.debugPipeline = null;
    this.debugVertexBuffer = null;
    this.debugMatrixBuffer = null;
    this.debugCommands = [];
    this.debugVertexCount = 0;

    this.views = [new Gfx3View()];
    this.currentView = this.views[0];

    this.showDebug = false;
    this.vpcMatrix = Utils.MAT4_IDENTITY();
    this.defaultTexture = new Gfx3Texture();
  }

  async initialize() {
    if (!navigator.gpu) {
      Utils.FAIL('This browser does not support webgpu');
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - navigator.gpu not found');
    }

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      Utils.FAIL('This browser appears to support WebGPU but it\'s disabled');
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Adapter not found');
    }

    this.device = await this.adapter.requestDevice();
    this.device.lost.then(() => {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Device has been lost');
    });

    this.canvas = document.getElementById('CANVAS_3D');
    if (!this.canvas) {
      throw new Error('Gfx3Manager::Gfx3Manager: CANVAS_3D not found');
    }

    this.ctx = this.canvas.getContext('webgpu');
    if (!this.ctx) {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Canvas does not support WebGPU');
    }

    this.ctx.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'opaque'
    });

    let devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.depthView = this.depthTexture.createView();

    this.meshPipeline = await CREATE_MESH_SHADER_RES(this.device);
    this.meshVertexBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    this.meshMatrixBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    this.debugPipeline = await CREATE_DEBUG_SHADER_RES(this.device);
    this.debugVertexBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    this.debugMatrixBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    let res = await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjkA43/A8AAtcBo43Eu70AAAAASUVORK5CYII=');
    let defaultImg = await res.blob();
    this.defaultTexture = this.createTextureFromBitmap(await createImageBitmap(defaultImg));

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  beginDrawing(viewIndex) {
    let view = this.views[viewIndex];
    let viewport = view.getViewport();
    let viewportX = this.canvas.width * viewport.xFactor;
    let viewportY = this.canvas.height * viewport.yFactor;
    let viewportWidth = this.canvas.width * viewport.widthFactor;
    let viewportHeight = this.canvas.height * viewport.heightFactor;
    let viewBgColor = view.getBgColor();

    this.vpcMatrix = Utils.MAT4_IDENTITY();
    this.vpcMatrix = Utils.MAT4_MULTIPLY(this.vpcMatrix, view.getClipMatrix());
    this.vpcMatrix = Utils.MAT4_MULTIPLY(this.vpcMatrix, view.getProjectionMatrix(viewportWidth / viewportHeight));
    this.vpcMatrix = Utils.MAT4_MULTIPLY(this.vpcMatrix, view.getCameraViewMatrix());

    this.commandEncoder = this.device.createCommandEncoder();
    this.passEncoder = this.commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.ctx.getCurrentTexture().createView(),
        clearValue: { r: viewBgColor[0], g: viewBgColor[1], b: viewBgColor[2], a: viewBgColor[3] },
        loadOp: 'clear',
        storeOp: 'store'
      }],
      depthStencilAttachment: {
        view: this.depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    });

    this.passEncoder.setViewport(viewportX, viewportY, viewportWidth, viewportHeight, 0, 1);
    this.passEncoder.setScissorRect(viewportX, viewportY, viewportWidth, viewportHeight);
    this.currentView = view;
    this.meshVertexCount = 0;
    this.meshCommands = [];
    this.debugVertexCount = 0;
    this.debugCommands = [];
  }

  endDrawing() {
    // mesh shader
    // ------------------------------------------------------------------------------------
    this.passEncoder.setPipeline(this.meshPipeline);

    this.meshVertexBuffer.destroy();
    this.meshVertexBuffer = this.device.createBuffer({
      size: this.meshVertexCount * 5 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.meshMatrixBuffer.destroy();
    this.meshMatrixBuffer = this.device.createBuffer({
      size: this.meshCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    for (let cmd of this.meshCommands) {
      let meshMatrixBinding = this.device.createBindGroup({
        layout: this.meshPipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: this.meshMatrixBuffer,
            offset: cmd[CMD_MATRIX_BUFFER_OFFSET],
            size: 16 * 4
          }
        }]
      });

      this.device.queue.writeBuffer(this.meshVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], new Float32Array(cmd[CMD_VERTEX_BUFFER_DATA]));
      this.device.queue.writeBuffer(this.meshMatrixBuffer, cmd[CMD_MATRIX_BUFFER_OFFSET], new Float32Array(cmd[CMD_MATRIX_BUFFER_DATA]));
      this.passEncoder.setBindGroup(0, meshMatrixBinding);
      this.passEncoder.setBindGroup(1, cmd[CMD_TEXTURE_GROUP]);
      this.passEncoder.setVertexBuffer(0, this.meshVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], cmd[CMD_VERTEX_BUFFER_SIZE]);
      this.passEncoder.draw(cmd[CMD_VERTEX_COUNT]);
    }

    // debug shader
    // ------------------------------------------------------------------------------------
    this.passEncoder.setPipeline(this.debugPipeline);

    this.debugVertexBuffer.destroy();
    this.debugVertexBuffer = this.device.createBuffer({
      size: this.debugVertexCount * 6 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.debugMatrixBuffer.destroy();
    this.debugMatrixBuffer = this.device.createBuffer({
      size: this.debugCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    for (let cmd of this.debugCommands) {
      let debugMatrixBinding = this.device.createBindGroup({
        layout: this.debugPipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: this.debugMatrixBuffer,
            offset: cmd[CMD_MATRIX_BUFFER_OFFSET],
            size: 4 * 16
          }
        }]
      });

      this.device.queue.writeBuffer(this.debugVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], new Float32Array(cmd[CMD_VERTEX_BUFFER_DATA]));
      this.device.queue.writeBuffer(this.debugMatrixBuffer, cmd[CMD_MATRIX_BUFFER_OFFSET], new Float32Array(cmd[CMD_MATRIX_BUFFER_DATA]));
      this.passEncoder.setBindGroup(0, debugMatrixBinding);
      this.passEncoder.setVertexBuffer(0, this.debugVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], cmd[CMD_VERTEX_BUFFER_SIZE]);
      this.passEncoder.draw(cmd[CMD_VERTEX_COUNT]);
    }

    // submit to graphics pipeline
    // ------------------------------------------------------------------------------------
    this.passEncoder.end();
    this.device.queue.submit([this.commandEncoder.finish()]);
  }

  createTextureFromBitmap(bitmap) {
    let texture = new Gfx3Texture();

    texture.gpu = this.device.createTexture({
      size: [bitmap.width, bitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: texture.gpu }, [bitmap.width, bitmap.height]);

    texture.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });

    texture.group = this.device.createBindGroup({
      layout: this.meshPipeline.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: texture.sampler
      }, {
        binding: 1,
        resource: texture.gpu.createView()
      }]
    });

    return texture;
  }

  drawMesh(modelMatrix, vertexCount, vertices, texture) {
    let cmd = [];
    cmd[CMD_MATRIX_BUFFER_DATA] = Utils.MAT4_MULTIPLY(this.vpcMatrix, modelMatrix);
    cmd[CMD_MATRIX_BUFFER_OFFSET] = this.meshCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment;
    cmd[CMD_VERTEX_BUFFER_DATA] = vertices;
    cmd[CMD_VERTEX_BUFFER_OFFSET] = this.meshVertexCount * 5 * 4;
    cmd[CMD_VERTEX_BUFFER_SIZE] = vertexCount * 5 * 4;
    cmd[CMD_VERTEX_COUNT] = vertexCount;
    cmd[CMD_TEXTURE_GROUP] = texture ? texture.group : this.defaultTexture.group;
    this.meshVertexCount += vertexCount;
    this.meshCommands.push(cmd);
  }

  drawDebugLineList(modelMatrix, vertexCount, vertices) {
    if (!this.showDebug) {
      return;
    }

    let cmd = [];
    cmd[CMD_MATRIX_BUFFER_DATA] = Utils.MAT4_MULTIPLY(this.vpcMatrix, modelMatrix);
    cmd[CMD_MATRIX_BUFFER_OFFSET] = this.debugCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment;
    cmd[CMD_VERTEX_BUFFER_DATA] = vertices;
    cmd[CMD_VERTEX_BUFFER_OFFSET] = this.debugVertexCount * 6 * 4;
    cmd[CMD_VERTEX_BUFFER_SIZE] = vertexCount * 6 * 4;
    cmd[CMD_VERTEX_COUNT] = vertexCount;
    this.debugVertexCount += vertexCount;
    this.debugCommands.push(cmd);
  }

  getScreenPosition(viewIndex, x, y, z) {
    let view = this.views[viewIndex];
    let viewport = view.getViewport();
    let viewportWidth = this.canvas.width * viewport.widthFactor;
    let viewportHeight = this.canvas.height * viewport.heightFactor;

    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getClipMatrix());
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getProjectionMatrix(viewportWidth / viewportHeight));
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getCameraViewMatrix());

    let pos = Utils.MAT4_MULTIPLY_BY_VEC4(matrix, [x, y, z, 1]);
    return [pos[0] / pos[3], pos[1] / pos[3]];
  }

  getWidth() {
    return this.canvas.width;
  }

  getHeight() {
    return this.canvas.height;
  }

  getContext() {
    return this.ctx;
  }

  getDefaultTexture() {
    return this.defaultTexture;
  }

  getView(index) {
    return this.views[index];
  }

  getNumViews() {
    return this.views.length;
  }

  addView(view) {
    this.views.push(view);
  }

  changeView(index, view) {
    this.views[index] = view;
  }

  removeView(view) {
    this.views.splice(this.views.indexOf(view), 1);
  }

  releaseViews() {
    this.views = [];
  }

  getCurrentView() {
    return this.currentView;
  }

  setShowDebug(showDebug) {
    this.showDebug = showDebug;
  }

  handleWindowResize() {
    let devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

    this.depthTexture.destroy();
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.depthView = this.depthTexture.createView();
  }
}

module.exports.gfx3Manager = new Gfx3Manager();
},{"../core/utils":5,"./gfx3_shaders":9,"./gfx3_texture":10,"./gfx3_view":12}],9:[function(require,module,exports){
module.exports.CREATE_MESH_SHADER_RES = async function (device) {
  let pipeline = await device.createRenderPipelineAsync({
    label: 'Basic Pipline',
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: `
        @binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;

        struct VertexOutput {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragUV : vec2<f32>
        };

        @vertex
        fn main(
          @location(0) position : vec4<f32>,
          @location(1) uv : vec2<f32>
        ) -> VertexOutput {
          var output : VertexOutput;
          output.Position = mvpMatrix * position;
          output.fragUV = uv;
          return output;
        }`,
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 5 * 4, // 3 position 2 uv,
        attributes: [{
          label: 'position',
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3'
        },{
          label: 'uv',
          shaderLocation: 1,
          offset: 3 * 4,
          format: 'float32x2'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        @group(1) @binding(0) var Sampler: sampler;
        @group(1) @binding(1) var Texture: texture_2d<f32>;
      
        @fragment
        fn main(
          @location(0) fragUV: vec2<f32>
        ) -> @location(0) vec4<f32> {
          return textureSample(Texture, Sampler, fragUV);
        }`
      }),
      entryPoint: 'main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
        blend: {
          color: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add'
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add'
          }
        },
      }]
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
      frontFace: 'ccw'
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus'
    }
  });

  return pipeline;
}

module.exports.CREATE_DEBUG_SHADER_RES = async function (device) {
  let pipeline = await device.createRenderPipelineAsync({
    label: 'Line List Debug Pipline',
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: `
        @binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;

        struct VertexOutput {
          @builtin(position) Position : vec4<f32>,
          @location(0) color : vec3<f32>
        };

        @vertex
        fn main(
          @location(0) position : vec4<f32>,
          @location(1) color : vec3<f32>
        ) -> VertexOutput {
          var output : VertexOutput;
          output.Position = mvpMatrix * position;
          output.color = color;
          return output;
        }`,
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 6 * 4, // 3xf position + 3xf color
        attributes: [{
          label: 'position',
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3'
        },{
          label: 'color',
          shaderLocation: 1,
          offset: 3 * 4,
          format: 'float32x3'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        @fragment
        fn main(
          @location(0) color: vec3<f32>
        ) -> @location(0) vec4<f32> {
          return vec4(color, 1);
        }`
      }),
      entryPoint: 'main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'line-list',
      cullMode: 'back',
      frontFace: 'ccw'
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus'
    }
  });

  return pipeline;
}
},{}],10:[function(require,module,exports){
class Gfx3Texture {
  constructor() {
    this.gpu = null;
    this.sampler = null;
    this.group = null;
  }
}

module.exports.Gfx3Texture = Gfx3Texture;
},{}],11:[function(require,module,exports){
let { gfx3Manager } = require('./gfx3_manager');

class Gfx3TextureManager {
  constructor() {
    this.textures = {};
  }

  async loadTexture(path) {
    if (this.getTexture(path) != gfx3Manager.getDefaultTexture()) {
      return this.getTexture(path);
    }

    let res = await fetch(path);
    let img = await res.blob();
    let texture = gfx3Manager.createTextureFromBitmap(await createImageBitmap(img));

    this.textures[path] = texture;
    return texture;
  }

  deleteTexture(path) {
    if (!this.textures[path]) {
      throw new Error('Gfx3TextureManager::deleteTexture(): The texture file doesn\'t exist, cannot delete !');
    }

    this.textures[path].gpu.destroy();
    this.textures[path] = null;
    delete this.textures[path];
  }

  getTexture(path) {
    return this.textures[path] ? this.textures[path] : gfx3Manager.getDefaultTexture();
  }

  releaseTextures() {
    for (let path in this.textures) {
      this.textures[path].gpu.destroy();
      this.textures[path] = null;
      delete this.textures[path];
    }
  }
}

module.exports.gfx3TextureManager = new Gfx3TextureManager();
},{"./gfx3_manager":8}],12:[function(require,module,exports){
let { Utils } = require('../core/utils');
let { Gfx3Viewport } = require('./gfx3_viewport');

let ProjectionModeEnum = {
  PERSPECTIVE: 'PERSPECTIVE',
  ORTHOGRAPHIC: 'ORTHOGRAPHIC'
};

class Gfx3View {
  constructor() {
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.clipOffset = [0.0, 0.0];
    this.cameraMatrix = Utils.MAT4_IDENTITY();
    this.viewport = new Gfx3Viewport();
    this.projectionMode = ProjectionModeEnum.PERSPECTIVE;
    this.perspectiveFovy = Math.PI / 4;
    this.perspectiveNear = 2;
    this.perspectiveFar = 2000;
    this.orthographicSize = 1;
    this.orthographicDepth = 700;
    this.bgColor = [0.0, 0.0, 0.0, 1.0];
  }

  getProjectionMatrix(ar) {
    if (this.projectionMode == ProjectionModeEnum.PERSPECTIVE) {
      return Utils.MAT4_PERSPECTIVE(this.perspectiveFovy, ar, this.perspectiveNear, this.perspectiveFar);
    }
    else if (this.projectionMode == ProjectionModeEnum.ORTHOGRAPHIC) {
      return Utils.MAT4_ORTHOGRAPHIC(this.orthographicSize, this.orthographicDepth);
    }

    throw new Error('Gfx3Manager::setView(): ProjectionMode not valid !');
  }

  getScreenPosition(viewIndex, x, y, z) {
    let view = this.views[viewIndex];
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getClipMatrix());
    matrix = Utils.MAT4_MULTIPLY(matrix, this.getProjectionMatrix(viewIndex));
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getCameraViewMatrix());
    let pos = Utils.MAT4_MULTIPLY_BY_VEC4(matrix, [x, y, z, 1]);
    return [pos[0] / pos[3], pos[1] / pos[3]];
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

  getPositionZ() {
    return this.position[2];
  }

  setPosition(x, y, z) {
    this.position = [x, y, z];
    this.handleUpdateCameraMatrix();
  }

  move(x, y, z) {
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
    this.handleUpdateCameraMatrix();
  }

  getRotation() {
    return this.rotation;
  }

  getRotationX() {
    return this.rotation[0];
  }

  getRotationY() {
    return this.rotation[1];
  }

  getRotationZ() {
    return this.rotation[2];
  }

  setRotation(x, y, z) {
    this.rotation = [x, y, z];
    this.handleUpdateCameraMatrix();
  }

  rotate(x, y, z) {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
    this.handleUpdateCameraMatrix();
  }

  getScale() {
    return this.scale;
  }

  getScaleX() {
    return this.scale[0];
  }

  getScaleY() {
    return this.scale[1];
  }

  getScaleZ() {
    return this.scale[2];
  }

  setScale(x, y, z) {
    this.scale = [x, y, z];
    this.handleUpdateCameraMatrix();
  }

  zoom(x, y, z) {
    this.scale[0] += x;
    this.scale[1] += y;
    this.scale[2] += z;
    this.handleUpdateCameraMatrix();
  }

  getClipOffset() {
    return this.clipOffset;
  }

  getClipOffsetX() {
    return this.clipOffset[0];
  }

  getClipOffsetY() {
    return this.clipOffset[1];
  }

  setClipOffset(x, y) {
    this.clipOffset = [x, y];
  }

  getClipMatrix() {
    return Utils.MAT4_INVERT(Utils.MAT4_TRANSLATE(this.clipOffset[0], this.clipOffset[1], 0));
  }

  getCameraMatrix() {
    return this.cameraMatrix;
  }

  setCameraMatrix(cameraMatrix) {
    this.cameraMatrix = cameraMatrix;
  }

  getCameraViewMatrix() {
    return Utils.MAT4_INVERT(this.cameraMatrix);
  }

  getViewport() {
    return this.viewport;
  }

  setViewport(viewport) {
    this.viewport = viewport;
  }

  getProjectionMode() {
    return this.projectionMode;
  }

  setProjectionMode(projectionMode) {
    this.projectionMode = projectionMode;
  }

  getPerspectiveFovy() {
    return this.perspectiveFovy;
  }

  setPerspectiveFovy(perspectiveFovy) {
    this.perspectiveFovy = perspectiveFovy;
  }

  getPerspectiveNear() {
    return this.perspectiveNear;
  }

  setPerspectiveNear(perspectiveNear) {
    this.perspectiveNear = perspectiveNear;
  }

  getPerspectiveFar() {
    return this.perspectiveFar;
  }

  setPerspectiveFar(perspectiveFar) {
    this.perspectiveFar = perspectiveFar;
  }

  getOrthographicSize() {
    return this.orthographicSize;
  }

  setOrthographicSize(orthographicSize) {
    this.orthographicSize = orthographicSize;
  }

  getOrthographicDepth() {
    return this.orthographicDepth;
  }

  setOrthographicDepth(orthographicDepth) {
    this.orthographicDepth = orthographicDepth;
  }

  getBgColor() {
    return this.bgColor;
  }

  setBgColor(r, g, b, a) {
    this.bgColor = [r, g, b, a];
  }

  handleUpdateCameraMatrix() {
    this.cameraMatrix = Utils.MAT4_IDENTITY();
    this.cameraMatrix = Utils.MAT4_MULTIPLY(this.cameraMatrix, Utils.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]));
    this.cameraMatrix = Utils.MAT4_MULTIPLY(this.cameraMatrix, Utils.MAT4_ROTATE_Y(this.rotation[1]));
    this.cameraMatrix = Utils.MAT4_MULTIPLY(this.cameraMatrix, Utils.MAT4_ROTATE_X(this.rotation[0])); // y -> x -> z
    this.cameraMatrix = Utils.MAT4_MULTIPLY(this.cameraMatrix, Utils.MAT4_ROTATE_Z(this.rotation[2]));
    this.cameraMatrix = Utils.MAT4_MULTIPLY(this.cameraMatrix, Utils.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]));
  }
}

module.exports.ProjectionModeEnum = ProjectionModeEnum;
module.exports.Gfx3View = Gfx3View;
},{"../core/utils":5,"./gfx3_viewport":13}],13:[function(require,module,exports){
class Gfx3Viewport {
  constructor() {
    this.xFactor = 0;
    this.yFactor = 0;
    this.widthFactor = 1;
    this.heightFactor = 1;
  }
}

module.exports.Gfx3Viewport = Gfx3Viewport;
},{}],14:[function(require,module,exports){
let { eventManager } = require('../core/event_manager');
let { gfx3Manager } = require('../gfx3/gfx3_manager');
let { gfx3TextureManager } = require('../gfx3/gfx3_texture_manager');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');

class JAMFrame {
  constructor() {
    this.vertices = [];
    this.normals = [];
  }
}

class JAMAnimation {
  constructor() {
    this.name = '';
    this.startFrame = 0;
    this.endFrame = 0;
    this.frameDuration = 0;
  }
}

class Gfx3JAM extends Gfx3Drawable {
  constructor() {
    super();
    this.numVertices = 0;
    this.frames = [];
    this.animations = [];
    this.textureCoords = [];    
    this.texture = gfx3TextureManager.getTexture('');
    this.isLooped = true;
    this.currentAnimation = null;
    this.currentFrameIndex = 0;
    this.frameProgress = 0;
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JAM') {
      throw new Error('Gfx3JAM::loadFromFile(): File not valid !');
    }

    this.numVertices = json['NumVertices'];

    this.frames = [];
    for (let obj of json['Frames']) {
      let frame = new JAMFrame();
      frame.vertices = obj['Vertices'];
      frame.normals = obj['Normals'];
      this.frames.push(frame);
    }

    this.animations = [];
    for (let obj of json['Animations']) {
      let animation = new JAMAnimation();
      animation.name = obj['Name'];
      animation.startFrame = parseInt(obj['StartFrame']);
      animation.endFrame = parseInt(obj['EndFrame']);
      animation.frameDuration = parseInt(obj['FrameDuration']);
      this.animations.push(animation);
    }

    this.textureCoords = [];
    for (let textureCoord of json['TextureCoords']) {
      this.textureCoords.push(textureCoord);
    }

    this.currentAnimation = null;
    this.isLooped = true;
    this.currentFrameIndex = 0;
    this.frameProgress = 0;
  }

  update(ts) {
    if (!this.currentAnimation) {
      return;
    }

    let interpolateFactor = this.frameProgress / this.currentAnimation.frameDuration;
    let nextFrameIndex = 0;

    if (this.currentFrameIndex == this.currentAnimation.endFrame) {
      eventManager.emit(this, 'E_FINISHED');
      nextFrameIndex = this.isLooped ? this.currentAnimation.startFrame : this.currentAnimation.endFrame;
    }
    else {
      nextFrameIndex = this.currentFrameIndex + 1;
    }

    this.clearVertices();

    let currentFrame = this.frames[this.currentFrameIndex];
    let nextFrame = this.frames[nextFrameIndex];
    for (let i = 0; i < this.numVertices; i++) {
      let vax = currentFrame.vertices[i * 3 + 0];
      let vay = currentFrame.vertices[i * 3 + 1];
      let vaz = currentFrame.vertices[i * 3 + 2];
      let vbx = nextFrame.vertices[i * 3 + 0];
      let vby = nextFrame.vertices[i * 3 + 1];
      let vbz = nextFrame.vertices[i * 3 + 2];
      let vx = vax + ((vbx - vax) * interpolateFactor);
      let vy = vay + ((vby - vay) * interpolateFactor);
      let vz = vaz + ((vbz - vaz) * interpolateFactor);
      let tx = this.textureCoords[i * 2 + 0];
      let ty = this.textureCoords[i * 2 + 1];
      this.defineVertex(vx, vy, vz, tx, ty);
    }

    this.commitVertices();

    if (interpolateFactor >= 1) {
      this.currentFrameIndex = nextFrameIndex;
      this.frameProgress = 0;
    }
    else {
      this.frameProgress += ts;
    }
  }

  draw() {
    gfx3Manager.drawMesh(this.getModelMatrix(), this.vertexCount, this.vertices, this.texture);
  }

  play(animationName, isLooped = false, preventSameAnimation = false) {
    if (preventSameAnimation && this.currentAnimation && this.currentAnimation.name == animationName) {
      return;
    }

    let animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx3JAM::play: animation not found !');
    }

    this.currentAnimation = animation;
    this.isLooped = isLooped;
    this.currentFrameIndex = animation.startFrame;
    this.frameProgress = 0;
  }

  getTexture() {
    return this.texture;
  }

  setTexture(texture) {
    this.texture = texture;
  }
}

module.exports.Gfx3JAM = Gfx3JAM;
},{"../core/event_manager":3,"../gfx3/gfx3_drawable":7,"../gfx3/gfx3_manager":8,"../gfx3/gfx3_texture_manager":11}],15:[function(require,module,exports){
let { gfx3Manager } = require('../gfx3/gfx3_manager');
let { gfx3TextureManager } = require('../gfx3/gfx3_texture_manager');
let { Gfx3Drawable } = require('../gfx3/gfx3_drawable');

class Gfx3JSM extends Gfx3Drawable {
  constructor() {
    super();
    this.texture = gfx3TextureManager.getTexture('');
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JSM') {
      throw new Error('Gfx3JSM::loadFromFile(): File not valid !');
    }

    this.clearVertices();

    for (let i = 0; i < json['NumVertices']; i++) {
      let vx = json['Vertices'][i * 3 + 0];
      let vy = json['Vertices'][i * 3 + 1];
      let vz = json['Vertices'][i * 3 + 2];
      let tx = json['TextureCoords'][i * 2 + 0];
      let ty = json['TextureCoords'][i * 2 + 1];
      this.defineVertex(vx, vy, vz, tx, ty);
    }

    this.commitVertices();
  }

  draw() {
    gfx3Manager.drawMesh(this.getModelMatrix(), this.vertexCount, this.vertices, this.texture);
  }

  getTexture() {
    return this.texture;
  }

  setTexture(texture) {
    this.texture = texture;
  }
}

module.exports.Gfx3JSM = Gfx3JSM;
},{"../gfx3/gfx3_drawable":7,"../gfx3/gfx3_manager":8,"../gfx3/gfx3_texture_manager":11}],16:[function(require,module,exports){
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
},{"../core/utils":5,"../gfx3/gfx3_drawable":7,"../gfx3/gfx3_manager":8}],17:[function(require,module,exports){
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
},{}],18:[function(require,module,exports){
class JSCBlock {
  constructor() {
    this.id = '';
    this.description = '';
    this.calls = [];
  }
}

class JSCBlockCall {
  constructor() {
    this.commandName = '';
    this.commandArgs = [];
  }
}

/**
 * Classe représentant une machine de script.
 * Cette classe crée un contexte d'exécution et permet de lancer un script (fichier JSC).
 * Note: Chaque script à sa propre machine d'exécution.
 */
class ScriptMachine {
  /**
   * Créer une machine de script.
   */
  constructor() {
    this.blocks = [];
    this.commandRegister = new Map();
    this.enabled = true;
    this.currentBlockId = '';
    this.currentCallIndex = 0;
    this.onBeforeBlockExec = (block) => { };
    this.onAfterBlockExec = (block) => { };
    this.onBeforeCommandExec = (command) => { };
    this.onAfterCommandExec = (command) => { };
  }

  /**
   * Fonction de mise à jour.
   * @param {number} ts - Temps passé depuis la dernière mise à jour.
   */
  update(ts) {
    if (!this.enabled) {
      return;
    }

    let currentBlock = this.blocks.find(block => block.id == this.currentBlockId);
    if (!currentBlock) {
      return;
    }

    if (this.currentCallIndex == currentBlock.calls.length) {
      this.onAfterBlockExec(currentBlock);
      this.currentBlockId = '';
      this.currentCallIndex = 0;
      return;
    }

    if (this.currentCallIndex == 0) {
      this.onBeforeBlockExec(currentBlock);
    }

    let currentCall = currentBlock.calls[this.currentCallIndex];
    let jumpto = this.runCommand(currentCall.commandName, currentCall.commandArgs);
    if (typeof jumpto === 'string') {
      this.currentBlockId = jumpto;
      this.currentCallIndex = 0;
      return;
    }

    if (this.currentCallIndex < currentBlock.calls.length) {
      this.currentCallIndex++;
    }
  }

  /**
   * Charge un fichier "jsc".
   * @param {string} path - Le chemin du fichier.
   */
  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    this.blocks = [];
    for (let objBlock of json) {
      let block = new JSCBlock();
      block.id = objBlock['Id'];
      block.description = objBlock['Description'];
      block.calls = [];
      for (let objCall of objBlock['Calls']) {
        let call = new JSCBlockCall();
        call.commandName = objCall['Name'];
        call.commandArgs = objCall['Args'];
        block.calls.push(call);
      }

      this.blocks.push(block);
    }
  }

  /**
   * Enregistre une nouvelle commande.
   * Note: L'identifiant d'une commande doit être unique.
   * @param {string} key - L'identifiant de la commande.
   * @param {function} commandFunc - La fonction de la commande.
   */
  registerCommand(key, commandFunc = () => { }) {
    if (this.commandRegister.has(key)) {
      throw new Error('ScriptMachine::registerCommand: key already exist !')
    }

    this.commandRegister.set(key, commandFunc);
  }

  /**
   * Exécute une commande.
   * @param {string} key - L'identifiant de la commande.
   * @param {array} args - Un tableau d'arguments passés à la fonction de la commande.
   * @return {string} Le retour de la commande.
   */
  runCommand(key, args = []) {
    let command = this.commandRegister.get(key);
    if (!command) {
      throw new Error('ScriptMachine::runCommand: try to call an not existant command ' + key + ' !');
    }

    this.onBeforeCommandExec(command);
    let jumpto = command.call(this, ...args);
    this.onAfterCommandExec(command);
    return jumpto;
  }

  /**
   * Vide le registre des commandes.
   */
  clearCommandRegister() {
    this.commandRegister = new Map();
  }

  /**
   * Vérifie si la machine de script est activée.
   * @return {boolean} Le drapeau d'activation.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Définit d'activation.
   * @param {boolean} enabled - Le drapeau d'activation.
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Saute sur le block d'instructions ciblé.
   * @param {string} blockId - L'identifiant du block d'instructions.
   */
  jump(blockId) {
    this.currentBlockId = blockId;
    this.currentCallIndex = 0;
  }
}

module.exports.ScriptMachine = ScriptMachine;
},{}],19:[function(require,module,exports){
let { eventManager} = require('../core/event_manager');
const { UIWidget } = require('./ui_widget');

/**
 * Singleton représentant un gestionnaire d'interface utilisateur.
 */
class UIManager {
  /**
   * Créer un gestionnaire d'interface utilisateur.
   */
  constructor() {
    this.root = null;
    this.fadeLayer = null;
    this.overLayer = null;
    this.focusedWidget = null;
    this.widgets = [];

    this.root = document.getElementById('UI_ROOT');
    if (!this.root) {
      throw new Error('UIManager::UIManager: UI_ROOT element not found !');
    }

    this.fadeLayer = document.getElementById('UI_FADELAYER');
    if (!this.fadeLayer) {
      throw new Error('UIManager::UIManager: UI_FADELAYER element not found !');
    }

    this.overLayer = document.getElementById('UI_OVERLAYER');
    if (!this.overLayer) {
      throw new Error('UIManager::UIManager: UI_OVERLAYER element not found !');
    }
  }

  /**
   * Fonction de mise à jour.
   * @param {number} ts - Temps passé depuis la dernière mise à jour.
   */
  update(ts) {
    for (let widget of this.widgets) {
      widget.update(ts);
    }
  }

  /**
   * Récupère les widgets.
   * @return {array} Le tableau des widgets.
   */
  getWidgets() {
    return this.widgets;
  }

  /**
   * Donne le focus à {widget}.
   * @param {UIWidget} widget - L'élément d'interface utilisateur.
   */
  focus(widget) {
    if (this.focusedWidget) {
      this.focusedWidget.unfocus();
    }

    widget.focus();
    this.focusedWidget = widget;
    eventManager.emit(this, 'E_FOCUSED', { widget: widget });
  }

  /**
   * Enlève le focus.
   */
  unfocus() {
    if (!this.focusedWidget) {
      return;
    }

    this.focusedWidget.unfocus();
    this.focusedWidget = null;
    eventManager.emit(this, 'E_UNFOCUSED');
  }

  /**
   * Ajoute un élément HTML au noeud racine.
   * Nota bene: Idéal pour des éléments d'affichage simple et sans logique interne.
   * @param {Node} node - Element HTML.
   * @param {string} styles - Styles CSS.
   */
  addNode(node, styles = '') {
    node.style.cssText += styles;
    this.root.appendChild(node);
  }

  /**
   * Supprime un élément HTML au noeud racine.
   * Nota bene: Idéal pour des éléments d'affichage simple et sans logique interne.
   * @param {Node} node - Element HTML.
   */
  removeNode(node) {
    this.root.removeChild(node);
  }

  /**
   * Ajoute un widget au noeud racine.
   * @param {UIWidget} widget - Element d'interface utilisateur.
   * @param {string} styles - Styles CSS.
   * @return {UIWidget} L'élément d'interface utilisateur.
   */
  addWidget(widget, styles = '') {
    widget.appendStyles(styles);
    this.root.appendChild(widget.getNode());
    this.widgets.push(widget);
    return widget;
  }

  /**
   * Supprime un widget au noeud racine.
   * @param {UIWidget} widget - Element d'interface utilisateur.
   */
  removeWidget(widget) {
    let index = this.widgets.indexOf(widget);
    if (index == -1) {
      throw new Error('UIManager::removeWidget: fail to remove widget !');
    }

    if (this.widgets[index] == this.focusedWidget) {
      this.unfocus();
    }

    this.widgets[index].delete();
    this.widgets.splice(index, 1);
    return true;
  }

  /**
   * Supprime tous les widgets.
   */
  clear() {
    this.root.innerHTML = '';
    this.focusedWidget = null;

    while (this.widgets.length > 0) {
      let widget = this.widgets.pop();
      widget.delete();
    }
  }

  /**
   * Lance une animation de fondu (invisible -> fond noir).
   * @param {number} delay - La durée à attendre avant de débuter l'animation.
   * @param {number} ms - La durée de l'animation.
   * @param {string} transitionTimingFunction - Fonction d'interpolation.
   * @param {function} cb - Fonction appelée à la fin de l'animation.
   */
  fadeIn(delay, ms, transitionTimingFunction = 'linear', cb = () => {}) {
    this.fadeLayer.style.transitionDuration = ms + 'ms';
    this.fadeLayer.style.transitionDelay = delay + 'ms';
    this.fadeLayer.style.transitionTimingFunction = transitionTimingFunction;
    this.fadeLayer.style.opacity = 1;
    setTimeout(() => { cb(); }, delay + ms);
  }

  /**
   * Lance une animation de fondu (fond noir -> invisible).
   * @param {number} delay - La durée à attendre avant de débuter l'animation.
   * @param {number} ms - La durée de l'animation.
   * @param {string} transitionTimingFunction - Fonction d'interpolation.
   * @param {function} cb - Fonction appelée à la fin de l'animation.
   */
  fadeOut(delay, ms, transitionTimingFunction = 'linear', cb = () => {}) {
    this.fadeLayer.style.transitionDuration = ms + 'ms';
    this.fadeLayer.style.transitionDelay = delay + 'ms';
    this.fadeLayer.style.transitionTimingFunction = transitionTimingFunction;
    this.fadeLayer.style.opacity = 0;
    setTimeout(() => { cb(); }, delay + ms);
  }

  /**
   * Active la sur-couche opaque.
   * @param {boolean} enable - Si vrai, la sur-couche est activée.
   */
   enableOverlayer(enable) {
    this.overLayer.style.opacity = (enable) ? '1' : '0';
  }
}

module.exports.uiManager = new UIManager();
},{"../core/event_manager":3,"./ui_widget":20}],20:[function(require,module,exports){
let { eventManager } = require('../core/event_manager');

/**
 * Classe représentant un élément d'interface utilisateur.
 */
class UIWidget {
  /**
   * Créer un élément d'interface utilisateur.
   */
  constructor(options = {}) {
    this.id = options.id ?? '';
    this.className = options.className ?? '';
    this.template = options.template ?? '';
    this.node = document.createElement('div');
    this.node.className = this.className;
    this.node.innerHTML = this.template;
    this.handleKeyDownCb = (e) => this.onKeyDown(e);

    this.node.addEventListener('animationend', () => eventManager.emit(this, 'E_ANIMATION_FINISHED'));
  }

  /**
   * Fonction de mise à jour.
   * @param {number} ts - Temps passé depuis la dernière mise à jour.
   */
  update(ts) {
    // virtual method called during update phase !
  }

  /**
   * Destructeur.
   * Nota bene: Entraine la désinscription des évènements utilisateur et détache le noeud HTML de son parent.
   */
  delete() {
    document.removeEventListener('keydown', this.handleKeyDownCb);
    this.node.remove();
    this.node = null;
  }

  /**
   * Retourne l'identifiant.
   * @return {string} L'Identifiant.
   */
  getId() {
    return this.id;
  }

  /**
   * Définit l'identifiant.
   * @param {string} id - L'Identifiant.
   */
  setId(id) {
    this.id = id;
  }

  /**
   * Retourne le noeud HTML parent.
   * @param {HTMLElement} node - Le noeud HTML.
   */
  getNode() {
    return this.node;
  }

  /**
   * Ajoute du css dans le style-inline du noeud parent.
   * @param {string} styles - Le css.
   */
  appendStyles(styles) {
    this.node.style.cssText += styles;
  }

  /**
   * Donne le focus.
   * Nota bene: Souscription aux évènements utilisateur et ajout de la classe 'u-focused'.
   */
  focus() {
    this.node.classList.add('u-focused');
    eventManager.emit(this, 'E_FOCUSED');
    document.addEventListener('keydown', this.handleKeyDownCb);
  }

  /**
   * Enlève le focus.
   * Nota bene: Désinscription aux évènements utilisateur et suppréssion de la classe 'u-focused'.
   */
  unfocus() {
    this.node.classList.remove('u-focused');
    eventManager.emit(this, 'E_UNFOCUSED');
    document.removeEventListener('keydown', this.handleKeyDownCb);
  }

  /**
   * Vérifie si le widget est focus.
   * @return {boolean} Vrai si le widget est focus.
   */
  isFocused() {
    return this.node.classList.contains('u-focused') == true;
  }

  /**
   * Rends le widget visible.
   */
  setVisible(visible) {
    if (visible) {
      this.node.classList.remove('u-hidden');
      
    }
    else {
      this.node.classList.add('u-hidden');
    }
  }

  /**
   * Vérifie si le widget est visible.
   * @return {boolean} Vrai si le widget est visible.
   */
  isVisible() {
    return this.node.classList.contains('u-hidden') == false;
  }

  setEnabled(enabled) {
    if (enabled) {
      this.node.classList.remove('u-disabled');
    }
    else {
      this.node.classList.add('u-disabled');
    }
  }

  isEnabled() {
    return this.node.classList.contains('u-disabled') === false;
  }

  setSelected(selected) {
    if (selected) {
      this.node.classList.add('u-selected');
    }
    else {
      this.node.classList.remove('u-selected');
    }
  }

  isSelected() {
    return this.node.classList.contains('u-selected');
  }

  animate(animation) {
    this.node.style.animation = animation;
  }

  onKeyDown(e) {
    // virtual method !
  }
}

module.exports.UIWidget = UIWidget;
},{"../core/event_manager":3}],21:[function(require,module,exports){
let { eventManager } = require('../core/event_manager');
let { UIWidget } = require('../ui/ui_widget');
let { UIMenuText } = require('../ui_menu_text/ui_menu_text');

class UIBubble extends UIWidget {
  constructor() {
    super({
      className: 'UIBubble',
      template: `
      <img class="UIBubble-picture js-picture" src=""/>
      <div class="UIBubble-content">
        <div class="UIBubble-author js-author"></div>
        <div class="UIBubble-text js-text"></div>
        <div class="UIBubble-menu js-menu"></div>
      </div>`
    });

    this.text = '';
    this.actions = [];
    this.stepDuration = 0;
    this.currentTextOffset = 0;
    this.currentActionTextOffset = 0;
    this.currentActionIndex = 0;
    this.timeElapsed = 0;
    this.isFinished = false;

    this.uiMenu = new UIMenuText();
    this.node.querySelector('.js-menu').replaceWith(this.uiMenu.getNode());
    eventManager.subscribe(this.uiMenu, 'E_ITEM_SELECTED', this, this.handleMenuItemSelected);
  }

  update(ts) {
    this.uiMenu.update(ts);

    if (!this.isFinished && this.currentTextOffset == this.text.length && this.currentActionIndex == this.actions.length) {
      this.isFinished = true;
      eventManager.emit(this, 'E_PRINT_FINISHED');
      return;
    }

    if (this.timeElapsed >= this.stepDuration) {
      if (this.currentTextOffset < this.text.length) {
        this.node.querySelector('.js-text').textContent = this.text.substring(0, this.currentTextOffset + 1);
        this.currentTextOffset++;
      }
      else if (this.currentActionIndex < this.actions.length) {
        if (this.currentActionTextOffset == 0) {
          this.uiMenu.add(this.currentActionIndex, '');
        }

        if (this.currentActionTextOffset < this.actions[this.currentActionIndex].length) {
          this.uiMenu.set(this.currentActionIndex, this.actions[this.currentActionIndex].substring(0, this.currentActionTextOffset + 1));
          this.currentActionTextOffset++;
        }
        else {
          this.currentActionIndex++;
          this.currentActionTextOffset = 0;
        }
      }

      this.timeElapsed = 0;
    }
    else {
      this.timeElapsed += ts;
    }
  }

  delete() {
    this.uiMenu.delete();
    super.delete();
  }

  focus() {
    this.uiMenu.focus();
    super.focus();
  }

  unfocus() {
    this.uiMenu.unfocus();
    super.unfocus();
  }

  setPicture(pictureFile) {
    this.node.querySelector('.js-picture').src = pictureFile;
  }

  setAuthor(author) {
    this.node.querySelector('.js-author').textContent = author;
  }

  setWidth(width) {
    this.node.style.width = width + 'px';
  }

  setText(text) {
    this.text = text;
    this.currentTextOffset = 0;
    this.isFinished = false;
  }

  setActions(actions) {
    this.actions = actions;
    this.currentActionIndex = 0;
    this.currentActionTextOffset = 0;
    this.isFinished = false;
    this.uiMenu.clear();
  }

  setStepDuration(stepDuration) {
    this.stepDuration = stepDuration;
  }

  handleMenuItemSelected(data) {
    eventManager.emit(this, 'E_ITEM_SELECTED', data);
  }

  onKeyDown(e) {
    if (e.key == 'Enter' && this.isFinished) {
      eventManager.emit(this, 'E_CLOSE');
    }
  }
}

module.exports.UIBubble = UIBubble;
},{"../core/event_manager":3,"../ui/ui_widget":20,"../ui_menu_text/ui_menu_text":23}],22:[function(require,module,exports){
let { eventManager } = require('../core/event_manager');
let { UIWidget } = require('../ui/ui_widget');

let MenuFocusEnum = {
  AUTO: 0,
  NONE: 1
};

let MenuAxisEnum = {
  X: 0,
  Y: 1,
  XY: 2
};

class UIMenu extends UIWidget {
  constructor(options = {}) {
    super({
      className: options.className ?? 'UIMenu'
    });

    this.axis = options.axis ?? MenuAxisEnum.Y;
    this.rows = options.rows ?? 0;
    this.columns = options.columns ?? 0;
    this.multiple = options.multiple ?? false;
    this.selectable = options.selectable ?? true;
    this.widgets = [];
    this.focusedWidget = null;
    this.selectedWidgets = [];

    if (this.axis == MenuAxisEnum.X) {
      this.rows = 1;
      this.columns = Infinity;
      this.node.style.display = 'flex';
      this.node.style.flexDirection = 'row';
    }
    else if (this.axis == MenuAxisEnum.Y) {
      this.rows = Infinity;
      this.columns = 1;
      this.node.style.display = 'flex';
      this.node.style.flexDirection = 'column';
    }
    else {
      this.node.style.display = 'grid';
      this.node.style.grid = 'repeat(' + this.rows + ', auto) / repeat(' + this.columns + ', auto)';
    }
  }

  update(ts) {
    for (let widget of this.widgets) {
      widget.update(ts);
    }
  }

  focus(focusIndex = MenuFocusEnum.AUTO) {
    if (focusIndex == MenuFocusEnum.AUTO) {
      let focusedIndex = this.widgets.indexOf(this.focusedWidget);
      this.focusWidget(focusedIndex > 0 ? focusedIndex : 0, true);
    }
    else if (focusIndex >= 0) {
      this.focusWidget(focusIndex, true);
    }

    super.focus();
  }

  getFocusedWidgetId() {
    return this.focusedWidget ? this.focusedWidget.getId() : null;
  }

  getFocusedWidgetIndex() {
    return this.widgets.indexOf(this.focusedWidget);
  }

  getSelectedWidgetId() {
    return this.selectedWidgets[0] ? this.selectedWidgets[0].getId() : null;
  }

  getSelectedWidgetIndex() {
    return this.widgets.indexOf(this.selectedWidgets[0]);
  }

  getWidgets() {
    return this.widgets;
  }

  addWidget(widget, index = -1) {
    let widgetNode = widget.getNode();

    if (index == -1) {
      this.widgets.push(widget);
      this.node.appendChild(widgetNode);
    }
    else {
      this.widgets.splice(index + 1, 0, widget);
      this.node.insertBefore(widgetNode, this.node.children[index]);
    }

    widgetNode.addEventListener('click', () => this.handleWidgetClicked(widget));
    widgetNode.addEventListener('mousemove', () => this.handleWidgetHover(widget));
  }

  removeWidget(index) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::removeWidget(): widget not found !');
    }

    if (this.selectedWidgets.indexOf(widget) != -1) {
      this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);
    }

    if (this.focusedWidget == widget) {
      this.focusedWidget = null;
    }

    this.widgets.splice(this.widgets.indexOf(widget), 1);
    widget.delete();
  }

  focusWidget(index, preventScroll = false, emit = true) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::focusWidget(): widget not found !');
    }

    if (!preventScroll) {
      let rect = this.getViewRectWidget(index);
      if (rect.top < 0) {
        this.node.scrollTop += rect.top;
      }
      if (rect.bottom > this.node.clientHeight) {
        this.node.scrollTop += rect.bottom - this.node.clientHeight;
      }
    }

    this.widgets.forEach(w => w.unfocus());
    widget.focus();
    this.focusedWidget = widget;

    if (emit) {
      eventManager.emit(this, 'E_ITEM_FOCUSED', { id: widget.getId(), index: index });
    }
  }

  unfocusWidget(emit = true) {
    this.widgets.forEach(w => w.unfocus());
    this.focusedWidget = null;

    if (emit) {
      eventManager.emit(this, 'E_ITEM_UNFOCUSED');
    }
  }

  selectWidget(index, emit = true) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::selectWidget(): widget not found !');
    }
    if (!widget.isEnabled()) {
      return;
    }

    if (this.multiple && widget.isSelected()) {
      widget.setSelected(false);
      this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);
      return;
    }

    if (!this.multiple) {
      this.widgets.forEach(w => w.setSelected(false));
      this.selectedWidgets = [];
    }

    widget.setSelected(true);
    this.selectedWidgets.push(widget);

    if (emit) {
      eventManager.emit(this, 'E_ITEM_SELECTED', { id: widget.getId(), index: index });
    }
  }

  unselectWidget(index, emit = true) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::unselectWidget(): widget not found !');
    }
    if (!widget.isSelected()) {
      return;
    }

    widget.setSelected(false);
    this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);

    if (emit) {
      eventManager.emit(this, 'E_ITEM_UNSELECTED', { id: widget.getId(), index: index });
    }
  }

  unselectWidgets(emit = true) {
    this.widgets.forEach(w => w.setSelected(false));
    this.selectedWidgets = [];
    
    if (emit) {
      eventManager.emit(this, 'E_UNSELECTED');
    }
  }

  setEnabledWidget(index, enabled) {
    const widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::setEnabledWidget(): widget not found !');
    }

    widget.setEnabled(enabled);
  }

  setEnabledWidgets(enabled) {
    this.widgets.forEach(w => w.setEnabled(enabled));
  }

  clear() {
    this.widgets.forEach(w => w.delete());
    this.widgets = [];
    this.focusedWidget = null;
    this.selectedWidgets = [];
    this.node.innerHTML = '';
  }

  close() {
    this.unselectWidgets();
    this.unfocusWidget();
    this.hide();
  }

  getViewRectWidget(index) {
    let top = this.node.children[index].offsetTop - this.node.scrollTop;
    let bottom = top + this.node.children[index].offsetHeight;
    return { top, bottom };
  }

  onKeyDown(e) {
    let focusedIndex = this.getFocusedWidgetIndex();
    if (e.key == 'Escape') {
      eventManager.emit(this, 'E_CLOSED');
    }
    else if (e.key == 'Enter' && this.selectable && focusedIndex != -1) {
      this.selectWidget(focusedIndex);
    }
    else if (e.key == 'ArrowLeft') {
      let prevIndex = (focusedIndex - 1 < 0) ? this.widgets.length - 1 : focusedIndex - 1;
      this.focusWidget(prevIndex);
    }
    else if (e.key == 'ArrowRight') {
      let nextIndex = (focusedIndex + 1 > this.widgets.length - 1) ? 0 : focusedIndex + 1;
      this.focusWidget(nextIndex);
    }
    else if (e.key == 'ArrowUp') {
      let prevIndex = (focusedIndex - this.columns < 0) ? this.widgets.length - 1 : focusedIndex - this.columns;
      this.focusWidget(prevIndex);
    }
    else if (e.key == 'ArrowDown') {
      let nextIndex = (focusedIndex + this.columns > this.widgets.length - 1) ? 0 : focusedIndex + this.columns;
      this.focusWidget(nextIndex);
    }
  }

  handleWidgetClicked(widget) {
    if (!this.isFocused()) {
      return;
    }

    this.selectWidget(this.widgets.indexOf(widget), true);
  }

  handleWidgetHover(widget) {
    if (!this.isFocused()) {
      return;
    }

    this.focusWidget(this.widgets.indexOf(widget), true);
  }
}

module.exports.MenuFocusEnum = MenuFocusEnum;
module.exports.MenuAxisEnum = MenuAxisEnum;
module.exports.UIMenu = UIMenu;
},{"../core/event_manager":3,"../ui/ui_widget":20}],23:[function(require,module,exports){
let { UIMenu } = require('../ui_menu/ui_menu');
let { UIMenuTextItem } = require('./ui_menu_text_item');

class UIMenuText extends UIMenu {
  constructor(options = {}) {
    super(Object.assign(options, {
      className: 'UIMenuText'
    }));
  }

  add(id, text) {
    let item = new UIMenuTextItem();
    item.setId(id);
    item.setText(text);
    this.addWidget(item);
  }

  set(id, text) {
    let item = this.widgets.find(w => w.getId() == id);
    if (item == -1) {
      throw new Error('UIMenuText::set(): item not found !');
    }

    item.setText(text);
  }

  remove(id) {
    let widgetIndex = this.widgets.findIndex(w => w.getId() == id);
    if (widgetIndex == -1) {
      throw new Error('UIMenuText::remove(): item not found !');
    }

    this.removeWidget(widgetIndex);
  }

  getSelectedId() {
    return this.getSelectedWidgetId();
  }
}

module.exports.UIMenuText = UIMenuText;
},{"../ui_menu/ui_menu":22,"./ui_menu_text_item":24}],24:[function(require,module,exports){
let { UIWidget } = require('../ui/ui_widget');

class UIMenuTextItem extends UIWidget {
  constructor(options = {}) {
    super({
      className: 'UIMenuTextItem'
    });

    this.node.textContent = options.text ?? '';
  }

  setText(text) {
    this.node.textContent = text;
  }
}

module.exports.UIMenuTextItem = UIMenuTextItem;
},{"../ui/ui_widget":20}],25:[function(require,module,exports){
window.addEventListener('load', async () => {
  let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
  let { uiManager } = require('./lib/ui/ui_manager');
  let { Room } = require('./room');

  let then = Date.now();
  await gfx3Manager.initialize();

  let room = new Room();
  await room.loadFromFile('./assets/rooms/sample00/data.room', 'Spawn0000');
  document.addEventListener('keydown', (e) => handleKeyDown(e));
  run();

  function run(timeStamp = Date.now()) {
    let ts = timeStamp - then;
    then = timeStamp;

    uiManager.update(ts);
    room.update(ts);

    gfx3Manager.beginDrawing(0);
    room.draw();
    gfx3Manager.endDrawing();

    requestAnimationFrame(timeStamp => run(timeStamp));
  }

  function handleKeyDown(e) {
    if (e.repeat) {
      return;
    }

    room.handleKeyDownOnce(e);
  }  
});
},{"./lib/gfx3/gfx3_manager":8,"./lib/ui/ui_manager":19,"./room":27}],26:[function(require,module,exports){
let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3JAM } = require('./lib/gfx3_jam/gfx3_jam');
// ---------------------------------------------------------------------------------------

class Model extends Gfx3Drawable {
  constructor() {
    super();
    this.jam = new Gfx3JAM();
    this.radius = 0;
    this.onActionBlockId = '';
  }

  async loadFromData(data) {
    await this.jam.loadFromFile(data['JAMFile']);
    this.jam.setTexture(await gfx3TextureManager.loadTexture(data['TextureFile']));
    this.jam.play('IDLE', true);
    this.position[0] = data['PositionX'];
    this.position[1] = data['PositionY'];
    this.position[2] = data['PositionZ'];
    this.rotation[0] = data['RotationX'];
    this.rotation[1] = data['RotationY'];
    this.rotation[2] = data['RotationZ'];
    this.radius = data['Radius'];
    this.onActionBlockId = data['OnActionBlockId'];
  }

  update(ts) {
    this.jam.setPosition(this.position[0], this.position[1], this.position[2]);
    this.jam.setRotation(this.rotation[0], this.rotation[1], this.rotation[2]);
    this.jam.update(ts);
  }

  draw() {
    this.jam.draw();
  }

  getRadius() {
    return this.radius;
  }

  getOnActionBlockId() {
    return this.onActionBlockId;
  }
}

module.exports.Model = Model;
},{"./lib/gfx3/gfx3_drawable":7,"./lib/gfx3/gfx3_texture_manager":11,"./lib/gfx3_jam/gfx3_jam":14}],27:[function(require,module,exports){
let { eventManager } = require('./lib/core/event_manager');
let { uiManager } = require('./lib/ui/ui_manager');
let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Utils } = require('./lib/core/utils');
let { Gfx3JSM } = require('./lib/gfx3_jsm/gfx3_jsm');
let { Gfx3JWM } = require('./lib/gfx3_jwm/gfx3_jwm');
let { ScriptMachine } = require('./lib/script/script_machine');
let { UIBubble } = require('./lib/ui_bubble/ui_bubble');
// ---------------------------------------------------------------------------------------
let { Spawn } = require('./spawn');
let { Model } = require('./model');
let { Trigger } = require('./trigger');
let { Controller } = require('./controller');
let { Camera } = require('./camera');
// ---------------------------------------------------------------------------------------

class Room {
  constructor() {
    this.name = '';
    this.description = '';
    this.map = new Gfx3JSM();
    this.walkmesh = new Gfx3JWM();
    this.controller = new Controller();
    this.camera = new Camera();
    this.scriptMachine = new ScriptMachine();
    this.spawns = [];
    this.models = [];
    this.triggers = [];
    this.running = true;

    this.scriptMachine.registerCommand('LOAD_ROOM', Utils.BIND(this.$loadRoom, this));
    this.scriptMachine.registerCommand('CONTINUE', Utils.BIND(this.$continue, this));
    this.scriptMachine.registerCommand('STOP', Utils.BIND(this.$stop, this));
    this.scriptMachine.registerCommand('UI_CREATE_DIALOG', Utils.BIND(this.$uiCreateDialog, this));
    this.scriptMachine.registerCommand('MODEL_PLAY_ANIMATION', Utils.BIND(this.$modelPlayAnimation, this));
  }

  async loadFromFile(path, spawnName) {
    let response = await fetch(path);
    let json = await response.json();

    this.name = json['Name'];
    this.description = json['Description'];

    this.map = new Gfx3JSM();
    await this.map.loadFromFile(json['MapFile']);
    this.map.setTexture(await gfx3TextureManager.loadTexture(json['MapTextureFile']));

    this.walkmesh = new Gfx3JWM();
    await this.walkmesh.loadFromFile(json['WalkmeshFile']);

    this.controller = new Controller();
    await this.controller.loadFromData(json['Controller']);

    this.camera = new Camera();
    await this.camera.loadFromData(json['Camera']);
    this.camera.setTargetDrawable(this.controller);

    this.spawns = [];
    for (let obj of json['Spawns']) {
      let spawn = new Spawn();
      await spawn.loadFromData(obj);
      this.spawns.push(spawn);
    }

    this.models = [];
    for (let obj of json['Models']) {
      let model = new Model();
      await model.loadFromData(obj);
      this.models.push(model);
    }

    this.triggers = [];
    for (let obj of json['Triggers']) {
      let trigger = new Trigger();
      await trigger.loadFromData(obj);
      this.triggers.push(trigger);
    }

    let spawn = this.spawns.find(spawn => spawn.getName() == spawnName);
    this.controller.setPosition(spawn.getPositionX(), spawn.getPositionY(), spawn.getPositionZ());
    this.controller.setRotation(0, Utils.VEC2_ANGLE(spawn.getDirection()), 0);
    this.walkmesh.addWalker('CONTROLLER', this.controller.getPositionX(), this.controller.getPositionZ(), this.controller.getRadius());

    await this.scriptMachine.loadFromFile(json['ScriptFile']);
    this.scriptMachine.jump('ON_INIT');
    this.scriptMachine.setEnabled(true);

    eventManager.subscribe(this.controller, 'E_ACTION', this, this.handleControllerAction);
    eventManager.subscribe(this.controller, 'E_MOVED', this, this.handleControllerMoved);
  }

  handleKeyDownOnce(e) {
    this.controller.handleKeyDownOnce(e);
  }

  update(ts) {
    this.map.update(ts);
    this.walkmesh.update(ts);
    this.controller.update(ts);
    this.camera.update(ts);
    this.scriptMachine.update(ts);

    for (let spawn of this.spawns) {
      spawn.update(ts);
    }

    for (let model of this.models) {
      model.update(ts);
    }

    for (let trigger of this.triggers) {
      trigger.update(ts);
    }
  }

  draw() {
    this.map.draw();
    this.walkmesh.draw();
    this.controller.draw();

    for (let spawn of this.spawns) {
      spawn.draw();
    }

    for (let model of this.models) {
      model.draw();
    }

    for (let trigger of this.triggers) {
      trigger.draw();
    }
  }

  handleControllerAction({ handPositionX, handPositionY, handPositionZ }) {
    for (let trigger of this.triggers) {
      if (Utils.VEC3_DISTANCE(trigger.getPosition(), this.controller.getPosition()) <= this.controller.getRadius() + trigger.getRadius()) {
        if (trigger.getOnActionBlockId()) {
          this.scriptMachine.jump(trigger.getOnActionBlockId());
          return;
        }
      }
    }

    for (let model of this.models) {
      if (Utils.VEC3_DISTANCE(model.getPosition(), [handPositionX, handPositionY, handPositionZ]) <= model.getRadius()) {
        if (model.getOnActionBlockId()) {
          this.scriptMachine.jump(model.getOnActionBlockId());
          return;
        }
      }
    }
  }

  handleControllerMoved({ moveX, moveZ }) {
    for (let other of this.models) {
      let delta = Utils.VEC3_SUBSTRACT(this.controller.getPosition(), other.getPosition());
      let distance = Utils.VEC3_LENGTH(delta);
      let distanceMin = this.controller.getRadius() + other.getRadius();
      if (distance < distanceMin) {
        let c = Math.PI * 2 - (Math.PI * 2 - Math.atan2(delta[2], delta[0]));
        moveX += Math.cos(c) * (distanceMin - distance);
        moveZ += Math.sin(c) * (distanceMin - distance);
        break;
      }
    }

    let walker = this.walkmesh.moveWalker('CONTROLLER', moveX, moveZ);
    this.controller.setPosition(walker.x, walker.y, walker.z);

    for (let trigger of this.triggers) {
      let distance = Utils.VEC3_DISTANCE(trigger.getPosition(), this.controller.getPosition());
      let distanceMin = this.controller.getRadius() + trigger.getRadius();

      if (trigger.getOnEnterBlockId() && !trigger.isHovered() && distance < distanceMin) {
        this.scriptMachine.jump(trigger.getOnEnterBlockId());
        trigger.setHovered(true);
      }
      else if (trigger.getOnLeaveBlockId() && trigger.isHovered() && distance > distanceMin) {
        this.scriptMachine.jump(trigger.getOnLeaveBlockId());
        trigger.setHovered(false);
      }
    }
  }

  async $loadRoom(path, spawnName) {
    this.controller.setControllable(false);
    await this.loadFromFile(path, spawnName);
    this.controller.setControllable(true);
  }

  $continue() {
    this.controller.setControllable(true);
  }

  $stop() {
    this.controller.setControllable(false);
  }

  async $uiCreateDialog(author, picture, text, width, x, y, actions = []) {
    this.scriptMachine.setEnabled(false);
    let uiBubble = new UIBubble();

    uiBubble.setAuthor(author);
    uiBubble.setPicture(picture);
    uiBubble.setText(text);
    uiBubble.setWidth(width);
    uiBubble.setActions(actions);

    uiManager.addWidget(uiBubble, `position:absolute; top:${y}; left:${x}`);
    await eventManager.wait(uiBubble, 'E_PRINT_FINISHED');

    uiManager.focus(uiBubble);
    await eventManager.wait(uiBubble, 'E_CLOSE');
    uiManager.removeWidget(uiBubble);
    this.scriptMachine.setEnabled(true);
  }

  $modelPlayAnimation(modelIndex, animationName, isLooped) {
    let model = this.models[modelIndex];
    model.play(animationName, isLooped);
  }
}

module.exports.Room = Room;
},{"./camera":1,"./controller":2,"./lib/core/event_manager":3,"./lib/core/utils":5,"./lib/gfx3/gfx3_texture_manager":11,"./lib/gfx3_jsm/gfx3_jsm":15,"./lib/gfx3_jwm/gfx3_jwm":16,"./lib/script/script_machine":18,"./lib/ui/ui_manager":19,"./lib/ui_bubble/ui_bubble":21,"./model":26,"./spawn":28,"./trigger":29}],28:[function(require,module,exports){
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3Debug } = require('./lib/gfx3/gfx3_debug');
// ---------------------------------------------------------------------------------------

class Spawn extends Gfx3Drawable {
  constructor() {
    super();
    this.name = '';
    this.direction = [0, 0];
    this.radius = 0.2;
  }

  async loadFromData(data) {
    this.name = data['Name'];
    this.position[0] = data['PositionX'];
    this.position[1] = data['PositionY'];
    this.position[2] = data['PositionZ'];
    this.direction[0] = data['DirectionX'];
    this.direction[1] = data['DirectionZ'];
  }

  draw() {
    Gfx3Debug.drawSphere(this.getModelMatrix(), this.radius, 2);
  }

  getName() {
    return this.name;
  }

  getDirection() {
    return this.direction;
  }

  getRadius() {
    return this.radius;
  }
}

module.exports.Spawn = Spawn;
},{"./lib/gfx3/gfx3_debug":6,"./lib/gfx3/gfx3_drawable":7}],29:[function(require,module,exports){
let { Gfx3Drawable } = require('./lib/gfx3/gfx3_drawable');
let { Gfx3Debug } = require('./lib/gfx3/gfx3_debug');
// ---------------------------------------------------------------------------------------

class Trigger extends Gfx3Drawable {
  constructor() {
    super();
    this.radius = 0;
    this.hovered = false;
    this.onEnterBlockId = '';
    this.onLeaveBlockId = '';
    this.onActionBlockId = '';
  }

  async loadFromData(data) {
    this.position[0] = data['PositionX'];
    this.position[1] = data['PositionY'];
    this.position[2] = data['PositionZ'];
    this.radius = data['Radius'];
    this.onEnterBlockId = data['OnEnterBlockId'];
    this.onLeaveBlockId = data['OnLeaveBlockId'];
    this.onActionBlockId = data['OnActionBlockId'];
  }

  draw() {
    Gfx3Debug.drawSphere(this.getModelMatrix(), this.radius, 2);
  }

  getRadius() {
    return this.radius;
  }

  isHovered() {
    return this.hovered;
  }

  setHovered(hovered) {
    this.hovered = hovered;
  }

  getOnEnterBlockId() {
    return this.onEnterBlockId;
  }

  getOnLeaveBlockId() {
    return this.onLeaveBlockId;
  }

  getOnActionBlockId() {
    return this.onActionBlockId;
  }
}

module.exports.Trigger = Trigger;
},{"./lib/gfx3/gfx3_debug":6,"./lib/gfx3/gfx3_drawable":7}]},{},[25]);

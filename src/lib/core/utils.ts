class UT {
  static EPSILON = 0.0000001;
  static VEC2_SIZE = 8;
  static VEC2_ZERO: vec2 = [0, 0];
  static VEC2_LEFT: vec2 = [-1, 0];
  static VEC2_RIGHT: vec2 = [1, 0];
  static VEC2_UP: vec2 = [0, 1];
  static VEC2_DOWN: vec2 = [0, -1];
  static VEC3_SIZE = 12;
  static VEC3_ZERO: vec3 = [0, 0, 0];
  static VEC3_BACKWARD: vec3 = [0, 0, 1];
  static VEC3_FORWARD: vec3 = [0, 0, -1];
  static VEC3_LEFT: vec3 = [-1, 0, 0];
  static VEC3_RIGHT: vec3 = [1, 0, 0];
  static VEC3_UP: vec3 = [0, 1, 0];
  static VEC3_DOWN: vec3 = [0, -1, 0];
  static VEC4_SIZE = 16;
  static VEC5_SIZE = 20;
  static VEC6_SIZE = 24;
  static MAT3_SIZE = 36;
  static MAT4_SIZE = 64;
  static F01_SIZE = 4;
  static F02_SIZE = 8;
  static F03_SIZE = 12;
  static F04_SIZE = 16;
  static F05_SIZE = 20;
  static F06_SIZE = 24;
  static F07_SIZE = 28;
  static F08_SIZE = 32;
  static F09_SIZE = 36;
  static F10_SIZE = 40;
  static F11_SIZE = 44;
  static F12_SIZE = 48;
  static F13_SIZE = 52;
  static F14_SIZE = 56;
  static F15_SIZE = 60;
  static F16_SIZE = 64;

  static FAIL(message: string) {
    const elem = document.querySelector<HTMLDivElement>('#APP_FAIL')!;
    elem.classList.add('SHOW');
    elem.textContent = message;
  }

  static WAIT(ms: number): Promise<any> {
    return new Promise((resolve: Function) => {
      window.setTimeout(() => resolve(), ms);
    });
  }

  static SHUFFLE(arr: Array<any>): Array<any> {
    const res = arr.slice();
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

  static RANDARRAY(min: number, max: number): Array<number> {
    const arr = [];
    for (let i = min; i <= max; i++) {
      arr.push(i);
    }

    return UT.SHUFFLE(arr);
  }

  static GET_RANDOM_INT(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  static GET_RANDOM_FLOAT(min: number, max: number): number {
    return (Math.random() * (max - min)) + min;
  }

  static CLAMP(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  static DEG_TO_RAD(deg: number): number {
    return deg * (Math.PI / 180);
  }

  static LERP(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static TO_FIXED_NUMBER(num: number, digits: number, base: number = 10): number {
    const pow = Math.pow(base, digits);
    return Math.round(num * pow) / pow;
  }

  static CIRCLE_COLLIDE(c1: vec3, r1: number, c2: vec3, r2: number, outVelocity: vec2 = [0, 0]): boolean {
    const delta = UT.VEC3_SUBSTRACT(c1, c2);
    const distance = UT.VEC3_LENGTH(delta);
    const distanceMin = r1 + r2;

    if (distance > distanceMin) {
      return false;
    }

    const c = Math.PI * 2 - (Math.PI * 2 - Math.atan2(delta[2], delta[0]));
    outVelocity[0] = Math.cos(c) * (distanceMin - distance);
    outVelocity[1] = Math.sin(c) * (distanceMin - distance);
    return true;
  }

  /**************************************************************************/
  /* VEC2 */
  /**************************************************************************/

  static VEC2_CREATE(x: number = 0, y: number = 0): vec2_buf {
    const out = new Float32Array(2);
    out[0] = x;
    out[1] = y;
    return out;
  }

  static VEC2_PARSE(str: string, separator: string = ' ', out: vec2 = [0, 0]): vec2 {
    const a = str.split(separator);
    out[0] = parseFloat(a[0]);
    out[1] = parseFloat(a[1]);
    return out;
  }

  static VEC2_SET(v: vec2, x: number, y: number): void {
    v[0] = x;
    v[1] = y;
  }

  static VEC2_DISTANCE(a: vec2, b: vec2): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    return Math.sqrt((x * x) + (y * y));
  }

  static VEC2_LENGTH(a: vec2): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  }

  static VEC2_NORMALIZE(a: vec2, out: vec2 = [0, 0]): vec2 {
    const len = UT.VEC2_LENGTH(a);
    if (len > 0) {
      out[0] = a[0] / len;
      out[1] = a[1] / len;
    }

    return out;
  }

  static VEC2_DOT(a: vec2, b: vec2): number {
    return a[0] * b[0] + a[1] * b[1];
  }

  static VEC2_ADD(a: vec2, b: vec2, out: vec2 = [0, 0]): vec2 {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
  }

  static VEC2_SUBSTRACT(a: vec2, b: vec2, out: vec2 = [0, 0]): vec2 {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
  }

  static VEC2_MULTIPLY(a: vec2, b: vec2, out: vec2 = [0, 0]): vec2 {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
  }

  static VEC2_SCALE(a: vec2, scale: number, out: vec2 = [0, 0]): vec2 {
    out[0] = a[0] * scale;
    out[1] = a[1] * scale;
    return out;
  }

  static VEC2_ANGLE_BETWEEN(a: vec2, b: vec2): number {
    return Math.acos(UT.VEC2_DOT(a, b) / (UT.VEC2_LENGTH(a) * UT.VEC2_LENGTH(b)));
  }

  static VEC2_ANGLE(a: vec2): number {
    const angle = Math.atan2(a[1], a[0]);
    return (angle > 0) ? angle : (angle + Math.PI * 2);
  }

  static VEC2_ISEQUAL(a: vec2, b: vec2): boolean {
    return a[0] == b[0] && a[1] == b[1];
  }

  static VEC2_PROJECTION_COS(a: vec2, b: vec2, out: vec2 = [0, 0]): vec2 {
    const bLength = Math.sqrt((b[0] * b[0]) + (b[1] * b[1]));
    const scale = ((a[0] * b[0]) + (a[1] * b[1])) / (bLength * bLength);
    out[0] = b[0] * scale;
    out[1] = b[1] * scale;
    return out;
  }

  static VEC2_QUADRATIC_BEZIER(p0: vec2, p1: vec2, p2: vec2, t: number, out: vec2 = [0, 0]): vec2 {
    const pax = p0[0] + ((p1[0] - p0[0]) * t);
    const pay = p0[1] + ((p1[1] - p0[1]) * t);

    const pbx = p1[0] + ((p2[0] - p1[0]) * t);
    const pby = p1[1] + ((p2[1] - p1[1]) * t);

    out[0] = pax + ((pbx - pax) * t);
    out[1] = pay + ((pby - pay) * t);
    return out;
  }

  /**************************************************************************/
  /* VEC3 */
  /**************************************************************************/

  static VEC3_CREATE(x: number = 0, y: number = 0, z: number = 0): vec3_buf {
    const out = new Float32Array(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }

  static VEC3_PARSE(str: string, separator: string = ' ', out: vec3 = [0, 0, 0]): vec3 {
    const a = str.split(separator);
    out[0] = parseFloat(a[0]);
    out[1] = parseFloat(a[1]);
    out[2] = parseFloat(a[2]);
    return out;
  }

  static VEC3_SET(v: vec3, x: number, y: number, z: number): void {
    v[0] = x;
    v[1] = y;
    v[2] = z;
  }

  static VEC3_LERP(v1: vec3, v2: vec3, n: number): vec3 {
    const d = UT.VEC3_SUBSTRACT(v2, v1);
    return [v1[0] + d[0] * n, v1[1] + d[1] * n, v1[2] + d[2] * n];
  }

  static VEC3_HSL2RGB(h: number, s: number, l: number, out: vec3 = [0, 0, 0]): vec3 {
    let r, g, b;
    if (s == 0) {
      r = g = b = l; // achromatic
    }

    else {
      const hue2rgb = function hue2rgb(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    out[0] = Math.round(r);
    out[1] = Math.round(g);
    out[2] = Math.round(b);
    return out;
  };

  static VEC3_DISTANCE(a: vec3, b: vec3): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];
    return Math.sqrt((x * x) + (y * y) + (z * z));
  }

  static VEC3_LENGTH(a: vec3): number {
    return Math.sqrt((a[0] * a[0]) + (a[1] * a[1]) + (a[2] * a[2]));
  }

  static VEC3_NORMALIZE(a: vec3, out: vec3 = [0, 0, 0]): vec3 {
    const len = UT.VEC3_LENGTH(a);
    if (len > 0) {
      out[0] = a[0] / len;
      out[1] = a[1] / len;
      out[2] = a[2] / len;
    }

    return out;
  }

  static VEC3_DOT(a: vec3, b: vec3): number {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
  }

  static VEC3_CROSS(a: vec3, b: vec3 | vec4, out: vec3 = [0, 0, 0]): vec3 {
    out[0] = (a[1] * b[2]) - (a[2] * b[1]);
    out[1] = (a[2] * b[0]) - (a[0] * b[2]);
    out[2] = (a[0] * b[1]) - (a[1] * b[0]);
    return out;
  }

  static VEC3_ADD(a: vec3, b: vec3, out: vec3 = [0, 0, 0]): vec3 {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }

  static VEC3_SUBSTRACT(a: vec3, b: vec3, out: vec3 = [0, 0, 0]): vec3 {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }

  static VEC3_MULTIPLY(a: vec3, b: vec3, out: vec3 = [0, 0, 0]): vec3 {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }

  static VEC3_SCALE(a: vec3, scale: number, out: vec3 = [0, 0, 0]): vec3 {
    out[0] = a[0] * scale;
    out[1] = a[1] * scale;
    out[2] = a[2] * scale;
    return out;
  }

  static VEC3_ISEQUAL(a: vec3, b: vec3): boolean {
    return a[0] == b[0] && a[1] == b[1] && a[2] == b[2];
  }

  // @todo: check on review
  static VEC3_TRIANGLE_POINT_ELEVATION(a: vec3, b: vec3, c: vec3, p: vec2): number {
    const ab = UT.VEC3_CREATE(b[0] - a[0], 0, b[2] - a[2]);
    const ca = UT.VEC3_CREATE(a[0] - c[0], 0, a[2] - c[2]);
    const ap = UT.VEC3_CREATE(p[0] - a[0], 0, p[1] - a[2]);
    const bp = UT.VEC3_CREATE(p[0] - b[0], 0, p[1] - b[2]);
    const cp = UT.VEC3_CREATE(p[0] - c[0], 0, p[1] - c[2]);

    const area = UT.VEC3_LENGTH(UT.VEC3_CROSS(ab, ca));
    const wa = UT.VEC3_LENGTH(UT.VEC3_CROSS(bp, cp)) / area;
    const wb = UT.VEC3_LENGTH(UT.VEC3_CROSS(ap, cp)) / area;
    const wc = UT.VEC3_LENGTH(UT.VEC3_CROSS(ap, bp)) / area;

    const total = UT.TO_FIXED_NUMBER(wa + wb + wc, 5);
    if (total > 1) {
      return Infinity;
    }

    // pour finir, nous déterminons la coordonnée 'y' grâce aux poids precedemment trouvés.
    // celà est possible car : wa*HA + wb*HB = 0 et wa+wb*GH + wc*GC = 0.
    const vert = a[1] + ((b[1] - a[1]) * (wb / (wa + wb)));
    const elev = vert + ((c[1] - vert) * (wc / (wa + wb + wc)));
    return UT.TO_FIXED_NUMBER(elev, 5);
  }

  // @todo: check on review (pass on vec2)
  static VEC3_TRIANGLE_POINT_OUTSIDES(a: vec3, b: vec3, c: vec3, p: vec2): { ab: boolean, bc: boolean, ca: boolean } {
    const ab = UT.VEC3_CREATE(b[0] - a[0], 0, b[2] - a[2]);
    const bc = UT.VEC3_CREATE(c[0] - b[0], 0, c[2] - b[2]);
    const ca = UT.VEC3_CREATE(a[0] - c[0], 0, a[2] - c[2]);
    const ap = UT.VEC3_CREATE(p[0] - a[0], 0, p[1] - a[2]);
    const bp = UT.VEC3_CREATE(p[0] - b[0], 0, p[1] - b[2]);
    const cp = UT.VEC3_CREATE(p[0] - c[0], 0, p[1] - c[2]);
    const crossAPAB = UT.VEC3_CROSS(ap, ab);
    const crossBPBC = UT.VEC3_CROSS(bp, bc);
    const crossCPCA = UT.VEC3_CROSS(cp, ca);
    return {
      ab: UT.TO_FIXED_NUMBER(crossAPAB[1], 5) > 0,
      bc: UT.TO_FIXED_NUMBER(crossBPBC[1], 5) > 0,
      ca: UT.TO_FIXED_NUMBER(crossCPCA[1], 5) > 0
    }
  }

  // @todo: check on review (pass on vec2)
  static VEC3_TRIANGLE_POINT_IS_INSIDE(a: vec3, b: vec3, c: vec3, p: vec2): boolean {
    const sides = UT.VEC3_TRIANGLE_POINT_OUTSIDES(a, b, c, p);
    return !sides.ab && !sides.bc && !sides.ca;
  }

  static VEC3_INSIDE_TRIANGLE(p: vec3, a: vec3, b: vec3, c: vec3, n: vec3): boolean {
    const ab = UT.VEC3_SUBSTRACT(b, a);
    const bc = UT.VEC3_SUBSTRACT(c, b);
    const ca = UT.VEC3_SUBSTRACT(a, c);
    const ap = UT.VEC3_SUBSTRACT(p, a);
    const bp = UT.VEC3_SUBSTRACT(p, b);
    const cp = UT.VEC3_SUBSTRACT(p, c);

    const crossAPAB = UT.VEC3_CROSS(ab, ap);
    if (UT.VEC3_DOT(crossAPAB, n) < UT.EPSILON) {
      return false;
    }

    const crossBPBC = UT.VEC3_CROSS(bc, bp);
    if (UT.VEC3_DOT(crossBPBC, n) < UT.EPSILON) {
      return false;
    }

    const crossCPCA = UT.VEC3_CROSS(ca, cp);
    if (UT.VEC3_DOT(crossCPCA, n) < UT.EPSILON) {
      return false;
    }

    return true;
  }

  static VEC3_TRIANGLE_NORMAL(a: vec3, b: vec3, c: vec3, out: vec3 = [0, 0, 0]): vec3 {
    const ab = UT.VEC3_SUBSTRACT(b, a);
    const ac = UT.VEC3_SUBSTRACT(c, a);
    return UT.VEC3_CROSS(ab, ac, out);
  }

  static VEC3_QUADRATIC_BEZIER(p0: vec3, p1: vec3, p2: vec3, t: number, out: vec3 = [0, 0, 0]): vec3 {
    const pax = p0[0] + ((p1[0] - p0[0]) * t);
    const pay = p0[1] + ((p1[1] - p0[1]) * t);
    const paz = p0[2] + ((p1[2] - p0[2]) * t);

    const pbx = p1[0] + ((p2[0] - p1[0]) * t);
    const pby = p1[1] + ((p2[1] - p1[1]) * t);
    const pbz = p1[2] + ((p2[2] - p1[2]) * t);

    out[0] = pax + ((pbx - pax) * t);
    out[1] = pay + ((pby - pay) * t);
    out[2] = paz + ((pbz - paz) * t);
    return out;
  }

  /**************************************************************************/
  /* VEC4 */
  /**************************************************************************/

  static VEC4_CREATE(x: number = 0, y: number = 0, z: number = 0, w: number = 0): vec4_buf {
    const out = new Float32Array(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }

  static VEC4_PARSE(str: string, separator: string = ' ', out: vec4 = [0, 0, 0, 0]): vec4 {
    const a = str.split(separator);
    out[0] = parseFloat(a[0]);
    out[1] = parseFloat(a[1]);
    out[2] = parseFloat(a[2]);
    out[3] = 1.0;
    return out;
  }

  static VEC4_SET(v: vec4, x: number, y: number, z: number, w: number): void {
    v[0] = x;
    v[1] = y;
    v[2] = z;
    v[3] = w;
  }

  /**************************************************************************/
  /* MAT3 */
  /**************************************************************************/

  static MAT3_CREATE(): mat3_buf {
    const out = new Float32Array(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }

  static MAT3_MULTIPLY_BY_VEC3(a: mat3, v: vec3, out: vec3 = [0, 0, 0]): vec3 {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a10 = a[3];
    const a11 = a[4];
    const a12 = a[5];
    const a20 = a[6];
    const a21 = a[7];
    const a22 = a[8];
    const v00 = v[0];
    const v01 = v[1];
    const v02 = v[2];

    out[0] = v00 * a00 + v01 * a10 + v02 * a20;
    out[1] = v00 * a01 + v01 * a11 + v02 * a21;
    out[2] = v00 * a02 + v01 * a12 + v02 * a22;
    return out;
  }

  static MAT3_MULTIPLY(a: mat3, b: mat3, out: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]): mat3 {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a10 = a[3];
    const a11 = a[4];
    const a12 = a[5];
    const a20 = a[6];
    const a21 = a[7];
    const a22 = a[8];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b10 = b[3];
    const b11 = b[4];
    const b12 = b[5];
    const b20 = b[6];
    const b21 = b[7];
    const b22 = b[8];

    const c00 = b00 * a00 + b01 * a10 + b02 * a20;
    const c01 = b00 * a01 + b01 * a11 + b02 * a21;
    const c02 = b00 * a02 + b01 * a12 + b02 * a22;

    const c10 = b10 * a00 + b11 * a10 + b12 * a20;
    const c11 = b10 * a01 + b11 * a11 + b12 * a21;
    const c12 = b10 * a02 + b11 * a12 + b12 * a22;

    const c20 = b20 * a00 + b21 * a10 + b22 * a20;
    const c21 = b20 * a01 + b21 * a11 + b22 * a21;
    const c22 = b20 * a02 + b21 * a12 + b22 * a22;

    out[0] = c00;
    out[1] = c01;
    out[2] = c02;
    out[3] = c10;
    out[4] = c11;
    out[5] = c12;
    out[6] = c20;
    out[7] = c21;
    out[8] = c22;
    return out;
  }

  static MAT3_INVERT(a: mat3, out: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]): mat3 {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a10 = a[3];
    const a11 = a[4];
    const a12 = a[5];
    const a20 = a[6];
    const a21 = a[7];
    const a22 = a[8];
    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      throw new Error('UT::MAT4_INVERT(): det is invalid !');
    }

    det = 1.0 / det;

    const c00 = b01 * det;
    const c01 = (-a22 * a01 + a02 * a21) * det;
    const c02 = (a12 * a01 - a02 * a11) * det;

    const c10 = b11 * det;
    const c11 = (a22 * a00 - a02 * a20) * det;
    const c12 = (-a12 * a00 + a02 * a10) * det;

    const c20 = b21 * det;
    const c21 = (-a21 * a00 + a01 * a20) * det;
    const c22 = (a11 * a00 - a01 * a10) * det;

    out[0] = c00;
    out[1] = c01;
    out[2] = c02;
    out[3] = c10;
    out[4] = c11;
    out[5] = c12;
    out[6] = c20;
    out[7] = c21;
    out[8] = c22;
    return out;
  }

  static MAT3_IDENTITY(out: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]): mat3 {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }

  static MAT3_SCALE(x: number, y: number, out: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]): mat3 {
    out[0] = x;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = y;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }

  static MAT3_ROTATE(a: number, out: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]): mat3 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = -s;
    out[4] = c;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }

  static MAT3_TRANSLATE(x: number, y: number, out: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]): mat3 {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = x;
    out[7] = y;
    out[8] = 1;
    return out;
  }

  static MAT3_PROJECTION(w: number, h: number, out: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]): mat3 {
    out[0] = 2 / w;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 2 / h;
    out[5] = 0;
    out[6] = -1;
    out[7] = -1;
    out[8] = 1;
    return out;
  }

  /**************************************************************************/
  /* MAT4 */
  /**************************************************************************/

  static MAT4_CREATE(): mat3_buf {
    const out = new Float32Array(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  static MAT4_MULTIPLY_BY_VEC4(a: mat4, v: vec4, out: vec4 = [0, 0, 0, 0]): vec4 {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4];
    const a11 = a[5];
    const a12 = a[6];
    const a13 = a[7];
    const a20 = a[8];
    const a21 = a[9];
    const a22 = a[10];
    const a23 = a[11];
    const a30 = a[12];
    const a31 = a[13];
    const a32 = a[14];
    const a33 = a[15];
    const v00 = v[0];
    const v01 = v[1];
    const v02 = v[2];
    const v03 = v[3];

    out[0] = v00 * a00 + v01 * a10 + v02 * a20 + v03 * a30;
    out[1] = v00 * a01 + v01 * a11 + v02 * a21 + v03 * a31;
    out[2] = v00 * a02 + v01 * a12 + v02 * a22 + v03 * a32;
    out[3] = v00 * a03 + v01 * a13 + v02 * a23 + v03 * a33;
    return out;
  }

  static MAT4_MULTIPLY(a: mat4, b: mat4, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4];
    const a11 = a[5];
    const a12 = a[6];
    const a13 = a[7];
    const a20 = a[8];
    const a21 = a[9];
    const a22 = a[10];
    const a23 = a[11];
    const a30 = a[12];
    const a31 = a[13];
    const a32 = a[14];
    const a33 = a[15];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b10 = b[4];
    const b11 = b[5];
    const b12 = b[6];
    const b13 = b[7];
    const b20 = b[8];
    const b21 = b[9];
    const b22 = b[10];
    const b23 = b[11];
    const b30 = b[12];
    const b31 = b[13];
    const b32 = b[14];
    const b33 = b[15];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    return out;
  }

  static MAT4_COMPUTE(...matrices: Array<mat4>): mat4 {
    for (let i = 0; i < matrices.length - 1; i++) {
      matrices[i + 1] = UT.MAT4_MULTIPLY(matrices[i], matrices[i + 1]);
    }

    return matrices[matrices.length - 1];
  }

  static MAT4_INVERT(a: mat4, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4];
    const a11 = a[5];
    const a12 = a[6];
    const a13 = a[7];
    const a20 = a[8];
    const a21 = a[9];
    const a22 = a[10];
    const a23 = a[11];
    const a30 = a[12];
    const a31 = a[13];
    const a32 = a[14];
    const a33 = a[15];
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      throw new Error('UT::MAT4_INVERT(): det is invalid !');
    }

    det = 1.0 / det;

    const c00 = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    const c01 = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    const c02 = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    const c03 = (a22 * b04 - a21 * b05 - a23 * b03) * det;

    const c10 = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    const c11 = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    const c12 = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    const c13 = (a20 * b05 - a22 * b02 + a23 * b01) * det;

    const c20 = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    const c21 = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    const c22 = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    const c23 = (a21 * b02 - a20 * b04 - a23 * b00) * det;

    const c30 = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    const c31 = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    const c32 = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    const c33 = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    out[0] = c00;
    out[1] = c01;
    out[2] = c02;
    out[3] = c03;
    out[4] = c10;
    out[5] = c11;
    out[6] = c12;
    out[7] = c13;
    out[8] = c20;
    out[9] = c21;
    out[10] = c22;
    out[11] = c23;
    out[12] = c30;
    out[13] = c31;
    out[14] = c32;
    out[15] = c33;
    return out;
  }

  static MAT4_IDENTITY(out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  static MAT4_SCALE(x: number, y: number, z: number, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    out[0] = x;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = y;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = z;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  static MAT4_ROTATE_X(a: number, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = -s;
    out[7] = 0;
    out[8] = 0;
    out[9] = s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  static MAT4_ROTATE_Y(a: number, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    out[0] = c;
    out[1] = 0;
    out[2] = s;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = -s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  static MAT4_ROTATE_Z(a: number, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  static MAT4_TRANSLATE(x: number, y: number, z: number, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = x;
    out[13] = y;
    out[14] = z;
    out[15] = 1;
    return out;
  }

  static MAT4_TRANSFORM(position: vec3, rotation: vec3, scale: vec3, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    UT.MAT4_TRANSLATE(position[0], position[1], position[2], out);
    UT.MAT4_MULTIPLY(out, UT.MAT4_ROTATE_Y(rotation[1]), out);
    UT.MAT4_MULTIPLY(out, UT.MAT4_ROTATE_X(rotation[0]), out); // y -> x -> z
    UT.MAT4_MULTIPLY(out, UT.MAT4_ROTATE_Z(rotation[2]), out);
    UT.MAT4_MULTIPLY(out, UT.MAT4_SCALE(scale[0], scale[1], scale[2]), out);
    return out;
  }

  static MAT4_ORTHOGRAPHIC(size: number, depth: number, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    out[0] = 2 / size;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 2 / size;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = -2 / depth;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  static MAT4_PERSPECTIVE(fov: number, ar: number, near: number, far: number, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    out[0] = (1 / (Math.tan(fov / 2) * ar));
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1 / Math.tan(fov / 2);
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (near + far) / (near - far);
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) / (near - far);
    out[15] = 0;
    return out;
  }

  static MAT4_LOOKAT(position: vec3, target: vec3, vertical: vec3 = UT.VEC3_UP, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    const axeZ = UT.VEC3_NORMALIZE(UT.VEC3_SUBSTRACT(position, target));
    const axeX = UT.VEC3_CROSS(vertical, axeZ);
    const axeY = UT.VEC3_CROSS(axeZ, axeX);
    out[0] = axeX[0];
    out[1] = axeX[1];
    out[2] = axeX[2];
    out[3] = 0;
    out[4] = axeY[0];
    out[5] = axeY[1];
    out[6] = axeY[2];
    out[7] = 0;
    out[8] = axeZ[0];
    out[9] = axeZ[1];
    out[10] = axeZ[2];
    out[11] = 0;
    out[12] = position[0];
    out[13] = position[1];
    out[14] = position[2];
    out[15] = 1;
    return out;
  }

  static MAT4_TRANSPOSE(a: mat4, out: mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]): mat4 {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4];
    const a11 = a[5];
    const a12 = a[6];
    const a13 = a[7];
    const a20 = a[8];
    const a21 = a[9];
    const a22 = a[10];
    const a23 = a[11];
    const a30 = a[12];
    const a31 = a[13];
    const a32 = a[14];
    const a33 = a[15];
    out[0] = a00;
    out[1] = a10;
    out[2] = a20;
    out[3] = a30;
    out[4] = a01;
    out[5] = a11;
    out[6] = a21;
    out[7] = a31;
    out[8] = a02;
    out[9] = a12;
    out[10] = a22;
    out[11] = a32;
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
    out[15] = a33;
    return out;
  }

  /**************************************************************************/
  /* QUATERNION */
  /**************************************************************************/

  static QUATERNION_TO_EULER(q: { x: number, y: number, z: number, w: number }): { yaw: number, pitch: number, roll: number } {
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (q.w * q.y - q.z * q.x);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * (Math.PI / 2);
    }
    else {
      pitch = Math.asin(sinp);
    }

    const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
    const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { yaw, pitch, roll };
  }

  /**************************************************************************/
  /* RAY */
  /**************************************************************************/

  static RAY_TRIANGLE(origin: vec3, dir: vec3, a: vec3, b: vec3, c: vec3, culling: boolean = false, outIntersectPoint: vec3 = [0, 0, 0]): boolean {
    const ab = UT.VEC3_SUBSTRACT(b, a);
    const ac = UT.VEC3_SUBSTRACT(c, a);
    const n = UT.VEC3_CROSS(ab, ac);

    if (!UT.RAY_PLAN(origin, dir, a, b, c, n, culling, outIntersectPoint)) {
      return false;
    }

    return UT.VEC3_INSIDE_TRIANGLE(outIntersectPoint, a, b, c, n);
  }

  static RAY_PLAN(origin: vec3, dir: vec3, a: vec3, b: vec3, c: vec3, n: vec3, culling: boolean, outIntersectPoint: vec3 = [0, 0, 0]): boolean {
    const s = UT.VEC3_DOT(dir, n);
    if (culling && s >= 0) {
      return false;
    }

    if (s > -UT.EPSILON && s < UT.EPSILON) {
      return false;
    }

    const d = UT.VEC3_DOT(n, a) * -1;
    const l = UT.VEC3_DOT(n, origin) * -1;
    const t = (l - d) / s;

    outIntersectPoint[0] = origin[0] + (dir[0] * t);
    outIntersectPoint[1] = origin[1] + (dir[1] * t);
    outIntersectPoint[2] = origin[2] + (dir[2] * t);
    return true;
  }

  static RAY_BOX(origin: vec3, dir: vec3, min: vec3, max: vec3, outIntersectPoint: vec3 = [0, 0, 0]): boolean {
    for (let i = 0; i < 3; i++) {
      if (origin[i] < min[i]) {
        const t = (min[i] - origin[i]) / (dir[i]);
        const x = origin[0] + dir[0] * t;
        const y = origin[1] + dir[1] * t;
        const z = origin[2] + dir[2] * t;
        if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2]) {
          outIntersectPoint[0] = x;
          outIntersectPoint[1] = y;
          outIntersectPoint[2] = z;
          return true;
        }
      }
      else if (origin[i] > max[i]) {
        const t = (max[i] - origin[i]) / (dir[i]);
        const x = origin[0] + (dir[0] * t);
        const y = origin[1] + (dir[1] * t);
        const z = origin[2] + (dir[2] * t);
        if (x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2]) {
          outIntersectPoint[0] = x;
          outIntersectPoint[1] = y;
          outIntersectPoint[2] = z;
          return true;
        }
      }
    }

    return false;
  }
}

export { UT };
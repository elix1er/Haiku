class Utils {
  static FAIL(message: string) {
    const elem = document.querySelector<HTMLDivElement>('#APP_FAIL')!;
    elem.classList.add('SHOW');
    elem.textContent = message;
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

    return Utils.SHUFFLE(arr);
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

  /**************************************************************************/

  static VEC2_ZERO: vec2 = [0, 0];
  static VEC2_LEFT: vec2 = [-1, 0];
  static VEC2_RIGHT: vec2 = [1, 0];
  static VEC2_UP: vec2 = [0, 1];
  static VEC2_DOWN: vec2 = [0, -1];

  static VEC2_CREATE(x: number = 0, y: number = 0): vec2 {
    return [x, y];
  }

  static VEC2_DISTANCE(a: vec2, b: vec2): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    return Math.sqrt((x * x) + (y * y));
  }

  static VEC2_LENGTH(a: vec2): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  }

  static VEC2_NORMALIZE(a: vec2): vec2 {
    const len = Utils.VEC2_LENGTH(a);
    if (len > 0) {
      const x = a[0] / len;
      const y = a[1] / len;
      return [x, y];
    }
    else {
      return [0, 0];
    }
  }

  static VEC2_DOT(a: vec2, b: vec2): number {
    return a[0] * b[0] + a[1] * b[1];
  }

  static VEC2_ADD(a: vec2, b: vec2): vec2 {
    const x = a[0] + b[0];
    const y = a[1] + b[1];
    return [x, y];
  }

  static VEC2_SUBSTRACT(a: vec2, b: vec2): vec2 {
    const x = a[0] - b[0];
    const y = a[1] - b[1];
    return [x, y];
  }

  static VEC2_MULTIPLY(a: vec2, b: vec2): vec2 {
    const x = a[0] * b[0];
    const y = a[1] * b[1];
    return [x, y];
  }

  static VEC2_SCALE(a: vec2, scale: number): vec2 {
    const x = a[0] * scale;
    const y = a[1] * scale;
    return [x, y];
  }

  static VEC2_ANGLE_BETWEEN(a: vec2, b: vec2): number {
    return Math.acos(Utils.VEC2_DOT(a, b) / (Utils.VEC2_LENGTH(a) * Utils.VEC2_LENGTH(b)));
  }

  static VEC2_ANGLE(a: vec2): number {
    const angle = Math.atan2(a[1], a[0]);
    return (angle > 0) ? angle : (angle + Math.PI * 2);
  }

  static VEC2_ISEQUAL(a: vec2, b: vec2): boolean {
    return a[0] == b[0] && a[1] == b[1];
  }

  static VEC2_PROJECTION_COS(a: vec2, b: vec2): vec2 {
    const bLength = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
    const bNormalizer = (a[0] * b[0] + a[1] * b[1]) / (bLength * bLength);
    const x = b[0] * bNormalizer;
    const y = b[1] * bNormalizer;
    return [x, y];
  }

  /**************************************************************************/

  static VEC3_ZERO: vec3 = [0, 0, 0];
  static VEC3_BACKWARD: vec3 = [0, 0, 1];
  static VEC3_FORWARD: vec3 = [0, 0, -1];
  static VEC3_LEFT: vec3 = [-1, 0, 0];
  static VEC3_RIGHT: vec3 = [1, 0, 0];
  static VEC3_UP: vec3 = [0, 1, 0];
  static VEC3_DOWN: vec3 = [0, -1, 0];

  static VEC3_CREATE(x: number = 0, y: number = 0, z: number = 0): vec3 {
    return [x, y, z];
  }

  static VEC3_DISTANCE(a: vec3, b: vec3): number {
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];
    return Math.sqrt((x * x) + (y * y) + (z * z));
  }

  static VEC3_LENGTH(a: vec3): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  }

  static VEC3_NORMALIZE(a: vec3): vec3 {
    const len = Utils.VEC3_LENGTH(a);
    if (len > 0) {
      const x = a[0] / len;
      const y = a[1] / len;
      const z = a[2] / len;
      return [x, y, z];
    }
    else {
      return [0, 0, 0];
    }
  }

  static VEC3_DOT(a: vec3, b: vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  static VEC3_CROSS(a: vec3, b: vec3): vec3 {
    const x = a[1] * b[2] - a[2] * b[1];
    const y = a[2] * b[0] - a[0] * b[2];
    const z = a[0] * b[1] - a[1] * b[0];
    return [x, y, z];
  }

  static VEC3_ADD(a: vec3, b: vec3): vec3 {
    const x = a[0] + b[0];
    const y = a[1] + b[1];
    const z = a[2] + b[2];
    return [x, y, z];
  }

  static VEC3_SUBSTRACT(a: vec3, b: vec3): vec3 {
    const x = a[0] - b[0];
    const y = a[1] - b[1];
    const z = a[2] - b[2];
    return [x, y, z];
  }

  static VEC3_MULTIPLY(a: vec3, b: vec3): vec3 {
    const x = a[0] * b[0];
    const y = a[1] * b[1];
    const z = a[2] * b[2];
    return [x, y, z];
  }

  static VEC3_SCALE(a: vec3, scale: number): vec3 {
    const x = a[0] * scale;
    const y = a[1] * scale;
    const z = a[2] * scale;
    return [x, y, z];
  }

  static VEC3_ISEQUAL(a: vec3, b: vec3): boolean {
    return a[0] == b[0] && a[1] == b[1] && a[2] == b[2];
  }

  static VEC3_TRIANGLE_POINT_ELEVATION(a: vec3, b: vec3, c: vec3, p: vec2): number {
    const ab = Utils.VEC3_CREATE(b[0] - a[0], 0, b[2] - a[2]);
    const ca = Utils.VEC3_CREATE(a[0] - c[0], 0, a[2] - c[2]);
    const ap = Utils.VEC3_CREATE(p[0] - a[0], 0, p[1] - a[2]);
    const bp = Utils.VEC3_CREATE(p[0] - b[0], 0, p[1] - b[2]);
    const cp = Utils.VEC3_CREATE(p[0] - c[0], 0, p[1] - c[2]);

    const area = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(ab, ca));
    const wa = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(bp, cp)) / area;
    const wb = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(ap, cp)) / area;
    const wc = Utils.VEC3_LENGTH(Utils.VEC3_CROSS(ap, bp)) / area;

    const total = Utils.TO_FIXED_NUMBER(wa + wb + wc, 5);
    if (total > 1) {
      return Infinity;
    }

    // pour finir, nous déterminons la coordonnée 'y' grâce aux poids precedemment trouvés.
    // celà est possible car : wa*HA + wb*HB = 0 et wa+wb*GH + wc*GC = 0.
    const vert = a[1] + ((b[1] - a[1]) * (wb / (wa + wb)));
    const elev = vert + ((c[1] - vert) * (wc / (wa + wb + wc)));
    return Utils.TO_FIXED_NUMBER(elev, 5);
  }

  static VEC3_TRIANGLE_POINT_OUTSIDES(a: vec3, b: vec3, c: vec3, p: vec2): { ab: boolean, bc: boolean, ca: boolean } {
    const ab = Utils.VEC3_CREATE(b[0] - a[0], 0, b[2] - a[2]);
    const bc = Utils.VEC3_CREATE(c[0] - b[0], 0, c[2] - b[2]);
    const ca = Utils.VEC3_CREATE(a[0] - c[0], 0, a[2] - c[2]);
    const ap = Utils.VEC3_CREATE(p[0] - a[0], 0, p[1] - a[2]);
    const bp = Utils.VEC3_CREATE(p[0] - b[0], 0, p[1] - b[2]);
    const cp = Utils.VEC3_CREATE(p[0] - c[0], 0, p[1] - c[2]);
    const crossAPAB = Utils.VEC3_CROSS(ap, ab);
    const crossBPBC = Utils.VEC3_CROSS(bp, bc);
    const crossCPCA = Utils.VEC3_CROSS(cp, ca);
    return {
      ab: Utils.TO_FIXED_NUMBER(crossAPAB[1], 5) > 0,
      bc: Utils.TO_FIXED_NUMBER(crossBPBC[1], 5) > 0,
      ca: Utils.TO_FIXED_NUMBER(crossCPCA[1], 5) > 0
    }
  }

  static VEC3_TRIANGLE_POINT_IS_INSIDE(a: vec3, b: vec3, c: vec3, p: vec2): boolean {
    const sides = Utils.VEC3_TRIANGLE_POINT_OUTSIDES(a, b, c, p);
    return !sides.ab && !sides.bc && !sides.ca;
  }

  /**************************************************************************/

  static MAT3_MULTIPLY_BY_VEC3(a: mat3, v: vec3): vec3 {
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

    const c00 = v00 * a00 + v01 * a10 + v02 * a20;
    const c01 = v00 * a01 + v01 * a11 + v02 * a21;
    const c02 = v00 * a02 + v01 * a12 + v02 * a22;

    return [
      c00, c01, c02
    ];
  }

  static MAT3_MULTIPLY(a: mat3, b: mat3): mat3 {
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

    return [
      c00, c01, c02,
      c10, c11, c12,
      c20, c21, c22
    ];
  }

  static MAT3_INVERT(a: mat3): mat3 | null {
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
      return null;
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

    return [
      c00, c01, c02,
      c10, c11, c12,
      c20, c21, c22
    ];
  }

  static MAT3_IDENTITY(): mat3 {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
  }

  static MAT3_SCALE(x: number, y: number): mat3 {
    return [
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    ];
  }

  static MAT3_ROTATE(r: number): mat3 {
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [
      c, s, 0,
      -s, c, 0,
      0, 0, 1
    ];
  }

  static MAT3_TRANSLATE(x: number, y: number): mat3 {
    return [
      1, 0, 0,
      0, 1, 0,
      x, y, 1
    ]
  }

  static MAT3_PROJECTION(w: number, h: number): mat3 {
    return [
      2 / w, 0, 0,
      0, 2 / h, 0,
      -1, -1, 1
    ];
  }

  /**************************************************************************/

  static MAT4_MULTIPLY_BY_VEC4(a: mat4, v: vec4): vec4 {
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

    const c00 = v00 * a00 + v01 * a10 + v02 * a20 + v03 * a30;
    const c01 = v00 * a01 + v01 * a11 + v02 * a21 + v03 * a31;
    const c02 = v00 * a02 + v01 * a12 + v02 * a22 + v03 * a32;
    const c03 = v00 * a03 + v01 * a13 + v02 * a23 + v03 * a33;

    return [
      c00, c01, c02, c03
    ];
  }

  static MAT4_COMPUTE(...matrices: Array<mat4>): mat4 {
    for (let i = 0; i < matrices.length - 1; i++) {
      matrices[i + 1] = Utils.MAT4_MULTIPLY(matrices[i], matrices[i + 1]);
    }

    return matrices[matrices.length - 1];
  }

  static MAT4_MULTIPLY(a: mat4, b: mat4): mat4 {
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

    const c00 = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    const c01 = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    const c02 = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    const c03 = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

    const c10 = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    const c11 = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    const c12 = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    const c13 = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

    const c20 = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    const c21 = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    const c22 = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    const c23 = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

    const c30 = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    const c31 = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    const c32 = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    const c33 = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return [
      c00, c01, c02, c03,
      c10, c11, c12, c13,
      c20, c21, c22, c23,
      c30, c31, c32, c33
    ];
  }

  static MAT4_INVERT(a: mat4): mat4 {
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
      throw new Error('Utils::MAT4_INVERT(): det is invalid !');
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

    return [
      c00, c01, c02, c03,
      c10, c11, c12, c13,
      c20, c21, c22, c23,
      c30, c31, c32, c33
    ];
  }

  static MAT4_IDENTITY(): mat4 {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_SCALE(x: number, y: number, z: number): mat4 {
    return [
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_ROTATE_X(r: number): mat4 {
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_ROTATE_Y(r: number): mat4 {
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [
      c, 0, s, 0,
      0, 1, 0, 0,
      -s, 0, c, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_ROTATE_Z(r: number): mat4 {
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_TRANSLATE(x: number, y: number, z: number): mat4 {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]
  }

  static MAT4_TRANSFORM(position: vec3, rotation: vec3, scale: vec3): mat4 {
    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_TRANSLATE(position[0], position[1], position[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_X(rotation[0]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Y(rotation[1]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_ROTATE_Z(rotation[2]));
    matrix = Utils.MAT4_MULTIPLY(matrix, Utils.MAT4_SCALE(scale[0], scale[1], scale[2]));
    return matrix;
  }

  static MAT4_ORTHOGRAPHIC(size: number, depth: number): mat4 {
    return [
      2 / size, 0, 0, 0,
      0, 2 / size, 0, 0,
      0, 0, -2 / depth, 0,
      0, 0, 0, 1
    ];
  }

  static MAT4_PERSPECTIVE(fov: number, ar: number, near: number, far: number): mat4 {
    return [
      (1 / (Math.tan(fov / 2) * ar)), 0, 0, 0,
      0, 1 / Math.tan(fov / 2), 0, 0,
      0, 0, (near + far) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ];
  }

  static MAT4_LOOKAT(position: vec3, target: vec3, vertical: vec3 = [0, 1, 0]): mat4 {
    const axeZ = Utils.VEC3_NORMALIZE(Utils.VEC3_SUBSTRACT(target, position));
    const axeX = Utils.VEC3_CROSS(vertical, axeZ);
    const axeY = Utils.VEC3_CROSS(axeZ, axeX);

    return [
      axeX[0], axeX[1], axeX[2], 0,
      axeY[0], axeY[1], axeY[2], 0,
      axeZ[0], axeZ[1], axeZ[2], 0,
      position[0], position[1], position[2], 1
    ];
  }

  static MAT4_TRANSPOSE(a: mat4): mat4 {
    return [
      a[0], a[4], a[8], a[12],
      a[1], a[5], a[9], a[13],
      a[2], a[6], a[10], a[14],
      a[3], a[7], a[11], a[15]
    ]
  }

  static QUAT_TO_EULER(q: vec4, order: string) {
    // Borrowed from Three.JS :)
    // q is assumed to be normalized
    // http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
    const sqx = q[0] * q[0];
    const sqy = q[1] * q[1];
    const sqz = q[2] * q[2];
    const sqw = q[3] * q[3];
    const out = [];

    if (order === 'XYZ') {
      out[0] = Math.atan2(2 * (q[0] * q[3] - q[1] * q[2]), (sqw - sqx - sqy + sqz));
      out[1] = Math.asin(Utils.CLAMP(2 * (q[0] * q[2] + q[1] * q[3]), -1, 1));
      out[2] = Math.atan2(2 * (q[2] * q[3] - q[0] * q[1]), (sqw + sqx - sqy - sqz));
    } else if (order === 'YXZ') {
      out[0] = Math.asin(Utils.CLAMP(2 * (q[0] * q[3] - q[1] * q[2]), -1, 1));
      out[1] = Math.atan2(2 * (q[0] * q[2] + q[1] * q[3]), (sqw - sqx - sqy + sqz));
      out[2] = Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), (sqw - sqx + sqy - sqz));
    } else if (order === 'ZXY') {
      out[0] = Math.asin(Utils.CLAMP(2 * (q[0] * q[3] + q[1] * q[2]), -1, 1));
      out[1] = Math.atan2(2 * (q[1] * q[3] - q[2] * q[0]), (sqw - sqx - sqy + sqz));
      out[2] = Math.atan2(2 * (q[2] * q[3] - q[0] * q[1]), (sqw - sqx + sqy - sqz));
    } else if (order === 'ZYX') {
      out[0] = Math.atan2(2 * (q[0] * q[3] + q[2] * q[1]), (sqw - sqx - sqy + sqz));
      out[1] = Math.asin(Utils.CLAMP(2 * (q[1] * q[3] - q[0] * q[2]), -1, 1));
      out[2] = Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), (sqw + sqx - sqy - sqz));
    } else if (order === 'YZX') {
      out[0] = Math.atan2(2 * (q[0] * q[3] - q[2] * q[1]), (sqw - sqx + sqy - sqz));
      out[1] = Math.atan2(2 * (q[1] * q[3] - q[0] * q[2]), (sqw + sqx - sqy - sqz));
      out[2] = Math.asin(Utils.CLAMP(2 * (q[0] * q[1] + q[2] * q[3]), -1, 1));
    } else if (order === 'XZY') {
      out[0] = Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), (sqw - sqx + sqy - sqz));
      out[1] = Math.atan2(2 * (q[0] * q[2] + q[1] * q[3]), (sqw + sqx - sqy - sqz));
      out[2] = Math.asin(Utils.CLAMP(2 * (q[2] * q[3] - q[0] * q[1]), -1, 1));
    } else {
      console.log('No order given for quaternion to euler conversion.');
      return [0, 0, 0];
    }

    return out;
  }
}

export { Utils };
import { UT } from './utils';

class IN {
  static MAT4_INVERT(a: mat4): void {
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

    a[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    a[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    a[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    a[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;

    a[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    a[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    a[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    a[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;

    a[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    a[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    a[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    a[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;

    a[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    a[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    a[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    a[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  }

  static MAT4_SCALE(a: mat4, x: number, y: number, z: number): void {
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
    const b00 = x;
    const b01 = 0;
    const b02 = 0;
    const b03 = 0;
    const b10 = 0;
    const b11 = y;
    const b12 = 0;
    const b13 = 0;
    const b20 = 0;
    const b21 = 0;
    const b22 = z;
    const b23 = 0;
    const b30 = 0;
    const b31 = 0;
    const b32 = 0;
    const b33 = 1;

    a[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    a[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

    a[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    a[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    a[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    a[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

    a[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    a[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    a[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    a[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

    a[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    a[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    a[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    a[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  }

  static MAT4_ROTATE_X(a: mat4, t: number): void {
    const c = Math.cos(t);
    const s = Math.sin(t);

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
    const b00 = 1;
    const b01 = 0;
    const b02 = 0;
    const b03 = 0;
    const b10 = 0;
    const b11 = c;
    const b12 = -s;
    const b13 = 0;
    const b20 = 0;
    const b21 = s;
    const b22 = c;
    const b23 = 0;
    const b30 = 0;
    const b31 = 0;
    const b32 = 0;
    const b33 = 1;

    a[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    a[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

    a[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    a[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    a[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    a[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

    a[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    a[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    a[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    a[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

    a[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    a[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    a[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    a[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  }

  static MAT4_ROTATE_Y(a: mat4, t: number): void {
    const c = Math.cos(t);
    const s = Math.sin(t);

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
    const b00 = c;
    const b01 = 0;
    const b02 = s;
    const b03 = 0;
    const b10 = 0;
    const b11 = 1;
    const b12 = 0;
    const b13 = 0;
    const b20 = -s;
    const b21 = 0;
    const b22 = c;
    const b23 = 0;
    const b30 = 0;
    const b31 = 0;
    const b32 = 0;
    const b33 = 1;

    a[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    a[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

    a[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    a[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    a[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    a[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

    a[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    a[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    a[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    a[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

    a[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    a[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    a[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    a[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  }

  static MAT4_ROTATE_Z(a: mat4, t: number): void {
    const c = Math.cos(t);
    const s = Math.sin(t);

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
    const b00 = c;
    const b01 = s;
    const b02 = 0;
    const b03 = 0;
    const b10 = -s;
    const b11 = c;
    const b12 = 0;
    const b13 = 0;
    const b20 = 0;
    const b21 = 0;
    const b22 = 1;
    const b23 = 0;
    const b30 = 0;
    const b31 = 0;
    const b32 = 0;
    const b33 = 1;

    a[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    a[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

    a[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    a[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    a[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    a[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

    a[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    a[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    a[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    a[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

    a[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    a[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    a[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    a[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  }

  static MAT4_TRANSFORM(position: vec3, rotation: vec3, scale: vec3, matrix: mat4): void {
    UT.MAT4_TRANSLATE(position[0], position[1], position[2], matrix);
    IN.MAT4_ROTATE_Y(matrix, rotation[1]);
    IN.MAT4_ROTATE_X(matrix, rotation[0]);
    IN.MAT4_ROTATE_Z(matrix, rotation[2]);
    IN.MAT4_SCALE(matrix, scale[0], scale[1], scale[2]);
  }

  static QUAT_MULTIPLY_BY_VEC3(q: vec4, v: vec3, o: vec3 = [0, 0, 0]): vec3 {
    // Extract the vector part of the quaternion
    const u: vec3 = [q[0], q[1], q[2]];
    // Extract the scalar part of the quaternion
    const s = q[3];
    // Do the math
    return UT.VEC3_ADD(UT.VEC3_ADD(UT.VEC3_SCALE(u, 2 * UT.VEC3_DOT(u, v)), UT.VEC3_SCALE(v, (s * s - UT.VEC3_DOT(u, u)))), UT.VEC3_SCALE(UT.VEC3_CROSS(u, v), 2.0 * s), o);
  }

  static MAT4_MULTIPLY_BY_QUAT(a: mat4, q: vec4): void {
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

    const sqw = q[3] * q[3];
    const sqx = q[0] * q[0];
    const sqy = q[1] * q[1];
    const sqz = q[2] * q[2];

    // invs (inverse square length) is only required if quaternion is not already normalised
    const invs = 1 / (sqx + sqy + sqz + sqw)
    const b00 = (sqx - sqy - sqz + sqw) * invs; // since sqw + sqx + sqy + sqz =1/invs*invs
    const b11 = (-sqx + sqy - sqz + sqw) * invs;
    const b22 = (-sqx - sqy + sqz + sqw) * invs;

    let tmp1 = q[0] * q[1];
    let tmp2 = q[2] * q[3];
    const b01 = 2.0 * (tmp1 + tmp2) * invs;
    const b10 = 2.0 * (tmp1 - tmp2) * invs;

    tmp1 = q[0] * q[2];
    tmp2 = q[1] * q[3];
    const b02 = 2.0 * (tmp1 - tmp2) * invs;
    const b20 = 2.0 * (tmp1 + tmp2) * invs;
    tmp1 = q[1] * q[2];
    tmp2 = q[0] * q[3];
    const b12 = 2.0 * (tmp1 + tmp2) * invs;
    const b21 = 2.0 * (tmp1 - tmp2) * invs;

    const b03 = 0;
    const b13 = 0;
    const b23 = 0;
    const b30 = 0;
    const b31 = 0;
    const b32 = 0;
    const b33 = 1;

    a[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    a[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

    a[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    a[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    a[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    a[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

    a[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    a[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    a[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    a[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

    a[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    a[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    a[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    a[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  }
}

export { IN };
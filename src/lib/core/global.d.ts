export { };

declare global {
  type vec1 = Float32Array | [number];
  type vec2 = Float32Array | [number, number];
  type vec3 = Float32Array | [number, number, number];
  type vec4 = Float32Array | [number, number, number, number];
  type vec5 = Float32Array | [number, number, number, number, number];
  type vec6 = Float32Array | [number, number, number, number, number, number];

  type mat3 = Float32Array | [
    number, number, number,
    number, number, number,
    number, number, number
  ];

  type mat4 = Float32Array | [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
  ];

  type vec1_buf = Float32Array;
  type vec2_buf = Float32Array;
  type vec3_buf = Float32Array;
  type vec4_buf = Float32Array;
  type vec5_buf = Float32Array;
  type vec6_buf = Float32Array;
  type vec7_buf = Float32Array;
  type vec8_buf = Float32Array;
  type vec9_buf = Float32Array;
  type vec10_buf = Float32Array;
  type vec11_buf = Float32Array;
  type vec12_buf = Float32Array;
  type vec13_buf = Float32Array;
  type vec14_buf = Float32Array;
  type vec15_buf = Float32Array;
  type vec16_buf = Float32Array;
  type mat3_buf = Float32Array;
  type mat4_buf = Float32Array;
}
export { };

declare global {
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

  type vec2_buf = Float32Array;
  type vec3_buf = Float32Array;
  type vec4_buf = Float32Array;
  type vec5_buf = Float32Array;
  type vec6_buf = Float32Array;
  type mat3_buf = Float32Array;
  type mat4_buf = Float32Array;
}
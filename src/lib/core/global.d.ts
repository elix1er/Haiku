export { };

declare global {
  type vec2 = [number, number];
  type vec3 = [number, number, number];
  type vec4 = [number, number, number, number];

  type mat3 = [
    number, number, number,
    number, number, number,
    number, number, number
  ];

  type mat4 = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
  ];
}
import { Gfx3Mesh } from '../gfx3_mesh/gfx3_mesh';

class Gfx3MeshShapeSphere extends Gfx3Mesh {
  radius: number;
  sectorCount: number;
  stackCount: number;

  constructor(radius: number, sectorCount: number, stackCount: number, uvscale: vec2) {
    super();
    this.radius = radius;
    this.stackCount = stackCount;
    this.sectorCount = sectorCount;

    const vertices = [];
    const texcoords = [];
    const indices = [];

    let x, y, z, xy;                              // vertex position
    let s, t;                                     // vertex texCoord

    const sectorStep = 2 * Math.PI / sectorCount;
    const stackStep = Math.PI / stackCount;
    let sectorAngle, stackAngle;

    for (let i = 0; i <= stackCount; ++i) {
      stackAngle = Math.PI / 2 - i * stackStep;        // starting from pi/2 to -pi/2
      xy = radius * Math.cos(stackAngle);             // r * cos(u)
      y = radius * Math.sin(stackAngle);              // r * sin(u)

      // add (sectorCount+1) vertices per stack
      // first and last vertices have same position and normal, but different tex coords
      for (let j = 0; j <= sectorCount; ++j) {
        sectorAngle = j * sectorStep;           // starting from 0 to 2pi

        // vertex position (x, y, z)
        x = xy * Math.cos(sectorAngle);             // r * cos(u) * cos(v)
        z = xy * Math.sin(sectorAngle);             // r * cos(u) * sin(v)
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);

        // vertex tex coord (s, t) range between [0, 1]
        s = j / sectorCount;
        t = i / stackCount;
        texcoords.push(s);
        texcoords.push(1.0 - t);
      }
    }

    let k1, k2;
    for (let i = 0; i < stackCount; ++i) {
      k1 = i * (sectorCount + 1);     // beginning of current stack
      k2 = k1 + sectorCount + 1;      // beginning of next stack

      for (let j = 0; j < sectorCount; ++j, ++k1, ++k2) {
        // 2 triangles per sector excluding first and last stacks
        // k1 => k2 => k1+1
        if (i != 0) {
          indices.push(k1);
          indices.push(k2);
          indices.push(k1 + 1);
        }

        // k1+1 => k2 => k2+1
        if (i != (stackCount - 1)) {
          indices.push(k1 + 1);
          indices.push(k2);
          indices.push(k2 + 1);
        }
      }
    }

    this.build(vertices, texcoords, indices, uvscale);
  }
}

export { Gfx3MeshShapeSphere };
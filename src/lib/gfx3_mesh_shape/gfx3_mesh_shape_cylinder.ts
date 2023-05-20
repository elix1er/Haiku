import { Gfx3Mesh } from '../gfx3_mesh/gfx3_mesh';

class Gfx3MeshShapeCylinder extends Gfx3Mesh {
  radius: number;
  height: number;
  nsegs: number;

  constructor(radius: number, height: number, nsegs: number, uvscale: vec2) {
    super();

    this.radius = radius;
    this.height = height;
    this.nsegs = nsegs;

    const vertices = [];
    const texcoords = [];
    const indices = [];

    const delta = Math.PI * 2 / nsegs;
    const hh = this.height / 2;

    for (let n = 0, a = 0; n < this.nsegs; n++, a += delta) {
      const vt = [Math.cos(a) * radius, hh / 2, Math.sin(a) * radius];
      const vb = [Math.cos(a) * radius, -hh / 2, Math.sin(a) * radius];

      vertices.push(vt[0], vt[1], vt[2]);
      vertices.push(vb[0], vb[1], vb[2]);

      texcoords.push(n / this.nsegs, 0);
      texcoords.push(n / this.nsegs, 1);
    }

    /*
    vertices.push(vertices[0], vertices[1], vertices[2]);
    vertices.push(vertices[3], vertices[4], vertices[5]);

    texcoords.push(1, 0);
    texcoords.push(1, 1);
    */

    const ct = [0, hh / 2, 0];
    const cb = [0, -hh / 2, 0];

    vertices.push(ct[0], ct[1], ct[2]);
    vertices.push(cb[0], cb[1], cb[2]);

    texcoords.push(0.5, 0.5);
    texcoords.push(0.5, 0.5);

    for (let n = 0; n < this.nsegs; n++) {
      let i1 = n * 2 + 0;
      let i2 = n * 2 + 1;
        
      let i3 = ((n+1)<this.nsegs)? (n+1) *2 + 0 : 0;
      let i4 = ((n+1)<this.nsegs)? (n+1) *2 + 1 : 1;

      /*side*/
      indices.push(i3, i2, i1);
      indices.push(i4, i2, i3);

      /*cap*/
      indices.push(i3, i1, this.nsegs * 2);
      indices.push(i2, i4, this.nsegs * 2 + 1);
    }
    this.build(vertices, texcoords, indices, uvscale);
  }


}

export { Gfx3MeshShapeCylinder };
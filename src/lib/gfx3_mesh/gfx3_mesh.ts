import { gfx3MeshRenderer } from './gfx3_mesh_renderer';
import { UT } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Material } from './gfx3_mesh_material';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_mesh_shader';

class Gfx3Mesh extends Gfx3Drawable {
  material: Gfx3Material;

  constructor() {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.material = new Gfx3Material({});
  }

  delete(keepMat: boolean = false): void {
    if (!keepMat) {
      this.material.delete();
    }

    super.delete();
  }

  draw(): void {
    gfx3MeshRenderer.drawMesh(this);
  }

  setMaterial(material: Gfx3Material, keepMat: boolean = false): void {
    if (!keepMat) {
      this.material.delete();
    }

    this.material = material;
  }

  getMaterial(): Gfx3Material {
    return this.material;
  }

  build(positions: Array<number>, texcoords: Array<number>, indices: Array<number>, uvscale: vec2) {
    const vnorms = new Array();
    const vtang = new Array();
    const vbnorm = new Array();

    for (let i = 0; i < positions.length; i++) {
      vnorms[i] = UT.VEC3_CREATE(0, 0, 0);
      vtang[i] = UT.VEC3_CREATE(0, 0, 0);
      vbnorm[i] = UT.VEC3_CREATE(0, 0, 0);
    }

    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      const v0 = UT.VEC3_CREATE(positions[i1 * 3 + 0], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
      const v1 = UT.VEC3_CREATE(positions[i2 * 3 + 0], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
      const v2 = UT.VEC3_CREATE(positions[i3 * 3 + 0], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);

      const uv0 = UT.VEC2_CREATE(texcoords[i1 * 2 + 0] * uvscale[0], texcoords[i1 * 2 + 1] * uvscale[1]);
      const uv1 = UT.VEC2_CREATE(texcoords[i2 * 2 + 0] * uvscale[0], texcoords[i2 * 2 + 1] * uvscale[1]);
      const uv2 = UT.VEC2_CREATE(texcoords[i3 * 2 + 0] * uvscale[0], texcoords[i3 * 2 + 1] * uvscale[1]);

      const deltaPos1 = UT.VEC3_SUBSTRACT(v1, v0);
      const deltaPos2 = UT.VEC3_SUBSTRACT(v2, v0);

      const deltaUV1 = UT.VEC2_SUBSTRACT(uv1, uv0);
      const deltaUV2 = UT.VEC2_SUBSTRACT(uv2, uv0);

      const fnorm = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(deltaPos1, deltaPos2));

      vnorms[i1] = UT.VEC3_ADD(vnorms[i1], fnorm);
      vnorms[i2] = UT.VEC3_ADD(vnorms[i2], fnorm);
      vnorms[i3] = UT.VEC3_ADD(vnorms[i3], fnorm);

      const r = 1.0 / ((deltaUV1[0] * deltaUV2[1]) - (deltaUV1[1] * deltaUV2[0]));

      const tx = ((deltaPos1[0] * deltaUV2[1]) - (deltaPos2[0] * deltaUV1[1])) * r;
      const ty = ((deltaPos1[1] * deltaUV2[1]) - (deltaPos2[1] * deltaUV1[1])) * r;
      const tz = ((deltaPos1[2] * deltaUV2[1]) - (deltaPos2[2] * deltaUV1[1])) * r;

      const ftang = UT.VEC3_NORMALIZE(UT.VEC3_CREATE(tx, ty, tz));

      vtang[i1] = UT.VEC3_ADD(vtang[i1], ftang);
      vtang[i2] = UT.VEC3_ADD(vtang[i2], ftang);
      vtang[i3] = UT.VEC3_ADD(vtang[i3], ftang);

      const bx = ((deltaPos2[0] * deltaUV1[0]) - (deltaPos1[0] * deltaUV2[0])) * r;
      const by = ((deltaPos2[1] * deltaUV1[0]) - (deltaPos1[1] * deltaUV2[0])) * r;
      const bz = ((deltaPos2[2] * deltaUV1[0]) - (deltaPos1[2] * deltaUV2[0])) * r;

      const fbnorm = UT.VEC3_NORMALIZE(UT.VEC3_CREATE(bx, by, bz));

      vbnorm[i1] = UT.VEC3_ADD(vbnorm[i1], fbnorm);
      vbnorm[i2] = UT.VEC3_ADD(vbnorm[i2], fbnorm);
      vbnorm[i3] = UT.VEC3_ADD(vbnorm[i3], fbnorm);
    }

    for (let i = 0; i < positions.length; i++) {
      vnorms[i] = UT.VEC3_NORMALIZE(vnorms[i]);
      vtang[i] = UT.VEC3_NORMALIZE(vtang[i]);
      vbnorm[i] = UT.VEC3_NORMALIZE(vbnorm[i]);
    }


    this.beginVertices(indices.length);

    for (let i = 0; i < indices.length; i += 3) {

      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      const v0 = UT.VEC3_CREATE(positions[i1 * 3 + 0], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
      const v1 = UT.VEC3_CREATE(positions[i2 * 3 + 0], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
      const v2 = UT.VEC3_CREATE(positions[i3 * 3 + 0], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);

      const uv0 = UT.VEC2_CREATE(texcoords[i1 * 2 + 0] * uvscale[0], texcoords[i1 * 2 + 1] * uvscale[1]);
      const uv1 = UT.VEC2_CREATE(texcoords[i2 * 2 + 0] * uvscale[0], texcoords[i2 * 2 + 1] * uvscale[1]);
      const uv2 = UT.VEC2_CREATE(texcoords[i3 * 2 + 0] * uvscale[0], texcoords[i3 * 2 + 1] * uvscale[1]);

      this.defineVertex(v0[0], v0[1], v0[2], uv0[0], 1.0 - uv0[1], vnorms[i1][0], vnorms[i1][1], vnorms[i1][2], vtang[i1][0], vtang[i1][1], vtang[i1][2], vbnorm[i1][0], vbnorm[i1][1], vbnorm[i1][2]);
      this.defineVertex(v1[0], v1[1], v1[2], uv1[0], 1.0 - uv1[1], vnorms[i2][0], vnorms[i2][1], vnorms[i2][2], vtang[i2][0], vtang[i2][1], vtang[i2][2], vbnorm[i2][0], vbnorm[i2][1], vbnorm[i2][2]);
      this.defineVertex(v2[0], v2[1], v2[2], uv2[0], 1.0 - uv2[1], vnorms[i3][0], vnorms[i3][1], vnorms[i3][2], vtang[i3][0], vtang[i3][1], vtang[i3][2], vbnorm[i3][0], vbnorm[i3][1], vbnorm[i3][2]);
    }

    this.endVertices();
  }

  clone(transformMatrix: mat4): Gfx3Mesh {
    const mesh = new Gfx3Mesh();
    mesh.beginVertices(this.vertexCount);

    for (let i = 0; i < this.vertices.length; i += this.vertexStride) {
      const v = UT.MAT4_MULTIPLY_BY_VEC4(transformMatrix, UT.VEC4_CREATE(this.vertices[i + 0], this.vertices[i + 1], this.vertices[i + 2], 1.0));
      mesh.defineVertex(v[0], v[1], v[2], this.vertices[i + 3], this.vertices[i + 4], this.vertices[i + 5], this.vertices[i + 6], this.vertices[i + 7], this.vertices[i + 8], this.vertices[i + 9], this.vertices[i + 10], this.vertices[i + 11], this.vertices[i + 12], this.vertices[i + 13]);
    }

    mesh.endVertices();
    mesh.setMaterial(this.material);
    return mesh;
  }

  get mat(): Gfx3Material {
    return this.material;
  }
}

export { Gfx3Mesh };
import { gfx3MeshRenderer } from './gfx3_mesh_renderer';
import { UT } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Material } from './gfx3_mesh_material';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_mesh_shader';

export interface Group {
  id: number,
  indices: Array<number>,
  vertexCount: number,
  smooth: boolean
};

class Gfx3Mesh extends Gfx3Drawable {
  material: Gfx3Material;

  constructor() {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.material = new Gfx3Material({});
  }

  static build(vertexCount: number, coords: Array<number>, texcoords: Array<number>, normals?: Array<number>, groups?: Array<Group>) {
    const finalVertices = new Array<number>();
    const vcoords = new Array<vec3>();
    const vtexs = new Array<vec2>();
    const vnorms = new Array<vec3>();
    const vtangs = new Array<vec3>();
    const vflips = new Array<number>();
    const vbnorms = new Array<vec3>();
    const vnormsByGroup = new Array<Array<vec3>>();
    const vtangsByGroup = new Array<Array<vec3>>();
    const indexStride = normals ? 3 : 2;

    if (!groups) {
      const indices = [];
      for (let i = 0; i < vertexCount; i++) {
        if (normals) {
          indices.push(i, i, i);
        }
        else {
          indices.push(i, i);
        }        
      }

      groups = [{ id: 0, indices: indices, vertexCount: vertexCount, smooth: false }];
    }

    for (let i = 0, n = 0; i < groups.length; i++) {
      const group = groups[i];
      vnormsByGroup[group.id] = [];
      vtangsByGroup[group.id] = [];

      for (let j = 0; j < group.vertexCount; j += 3, n += 3) {
        const cid0 = group.indices[(j + 0) * indexStride + 0];
        const cid1 = group.indices[(j + 1) * indexStride + 0];
        const cid2 = group.indices[(j + 2) * indexStride + 0];

        const tid0 = group.indices[(j + 0) * indexStride + 1];
        const tid1 = group.indices[(j + 1) * indexStride + 1];
        const tid2 = group.indices[(j + 2) * indexStride + 1];

        vcoords[n + 0] = [coords[cid0 * 3 + 0], coords[cid0 * 3 + 1], coords[cid0 * 3 + 2]];
        vcoords[n + 1] = [coords[cid1 * 3 + 0], coords[cid1 * 3 + 1], coords[cid1 * 3 + 2]];
        vcoords[n + 2] = [coords[cid2 * 3 + 0], coords[cid2 * 3 + 1], coords[cid2 * 3 + 2]];

        vtexs[n + 0] = [texcoords[tid0 * 2 + 0], texcoords[tid0 * 2 + 1]];
        vtexs[n + 1] = [texcoords[tid1 * 2 + 0], texcoords[tid1 * 2 + 1]];
        vtexs[n + 2] = [texcoords[tid2 * 2 + 0], texcoords[tid2 * 2 + 1]];

        const v01 = UT.VEC3_SUBSTRACT(vcoords[n + 1], vcoords[n + 0]);
        const v02 = UT.VEC3_SUBSTRACT(vcoords[n + 2], vcoords[n + 0]);

        const uv01 = UT.VEC2_SUBSTRACT(vtexs[n + 1], vtexs[n + 0]);
        const uv02 = UT.VEC2_SUBSTRACT(vtexs[n + 2], vtexs[n + 0]);

        if (normals) {
          const nid0 = group.indices[(j + 0) * indexStride + 2];
          const nid1 = group.indices[(j + 1) * indexStride + 2];
          const nid2 = group.indices[(j + 2) * indexStride + 2];
          vnorms[n + 0] = [normals[nid0 * 3 + 0], normals[nid0 * 3 + 1], normals[nid0 * 3 + 2]];
          vnorms[n + 1] = [normals[nid1 * 3 + 0], normals[nid1 * 3 + 1], normals[nid1 * 3 + 2]];
          vnorms[n + 2] = [normals[nid2 * 3 + 0], normals[nid2 * 3 + 1], normals[nid2 * 3 + 2]];
        }
        else {
          const fnorm = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(v01, v02));
          vnorms[n + 0] = fnorm;
          vnorms[n + 1] = fnorm;
          vnorms[n + 2] = fnorm;
        }

        if (group.smooth) {
          vnormsByGroup[group.id][cid0] = vnormsByGroup[group.id][cid0] ? UT.VEC3_ADD(vnormsByGroup[group.id][cid0], vnorms[n + 0]) : vnorms[n + 0];
          vnormsByGroup[group.id][cid1] = vnormsByGroup[group.id][cid1] ? UT.VEC3_ADD(vnormsByGroup[group.id][cid1], vnorms[n + 1]) : vnorms[n + 1];
          vnormsByGroup[group.id][cid2] = vnormsByGroup[group.id][cid2] ? UT.VEC3_ADD(vnormsByGroup[group.id][cid2], vnorms[n + 2]) : vnorms[n + 2];
        }

        const ftang: vec3 = [0, 0, 0];
        const fflip = COMPUTE_FACE_TANGENT(v01, v02, uv01, uv02, ftang);
        vflips[n + 0] = fflip;
        vflips[n + 1] = fflip;
        vflips[n + 2] = fflip;
        vtangs[n + 0] = ftang;
        vtangs[n + 1] = ftang;
        vtangs[n + 2] = ftang;

        if (group.smooth) {
          vtangsByGroup[group.id][cid0] = vtangsByGroup[group.id][cid0] ? UT.VEC3_ADD(vtangsByGroup[group.id][cid0], ftang) : ftang;
          vtangsByGroup[group.id][cid1] = vtangsByGroup[group.id][cid1] ? UT.VEC3_ADD(vtangsByGroup[group.id][cid1], ftang) : ftang;
          vtangsByGroup[group.id][cid2] = vtangsByGroup[group.id][cid2] ? UT.VEC3_ADD(vtangsByGroup[group.id][cid2], ftang) : ftang;
        }
      }
    }

    for (let i = 0, n = 0; i < groups.length; i++) {
      const group = groups[i];

      for (let j = 0; j < group.vertexCount; j++, n++) {
        const cid = group.indices[j * indexStride + 0];

        if (group.smooth) {
          vnorms[n] = UT.VEC3_NORMALIZE(vnormsByGroup[group.id][cid]);
          vtangs[n] = UT.VEC3_NORMALIZE(vtangsByGroup[group.id][cid]);
        }

        vbnorms[n] = UT.VEC3_SCALE(UT.VEC3_CROSS(vnorms[n], vtangs[n]), vflips[n]);
        finalVertices.push(vcoords[n][0], vcoords[n][1], vcoords[n][2], vtexs[n][0], vtexs[n][1], vnorms[n][0], vnorms[n][1], vnorms[n][2], vtangs[n][0], vtangs[n][1], vtangs[n][2], vbnorms[n][0], vbnorms[n][1], vbnorms[n][2]);
      }
    }

    return finalVertices;
  }

  delete(keepMat: boolean = false): void {
    if (!keepMat) {
      this.material.delete();
    }

    super.delete();
  }

  update(ts: number): void {
    this.material.update(ts);
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

  clone(transformMatrix: mat4 = UT.MAT4_IDENTITY()): Gfx3Mesh {
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

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function COMPUTE_FACE_TANGENT(v01: vec3, v02: vec3, uv01: vec2, uv02: vec2, out: vec3): number {
  const uv2xArea = ((uv01[0] * uv02[1]) - (uv01[1] * uv02[0]));
  if (Math.abs(uv2xArea) > UT.EPSILON) {
    const r = 1.0 / uv2xArea;
    const flip = uv2xArea > 0 ? 1 : -1;

    const tx = ((v01[0] * uv02[1]) - (v02[0] * uv01[1])) * r;
    const ty = ((v01[1] * uv02[1]) - (v02[1] * uv01[1])) * r;
    const tz = ((v01[2] * uv02[1]) - (v02[2] * uv01[1])) * r;

    const ftang = UT.VEC3_NORMALIZE([tx, ty, tz]);
    out[0] = ftang[0];
    out[1] = ftang[1];
    out[2] = ftang[2];
    return flip;
  }

  return -1;
}
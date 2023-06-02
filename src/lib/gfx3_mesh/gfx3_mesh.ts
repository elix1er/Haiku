import { gfx3MeshRenderer } from './gfx3_mesh_renderer';
import { UT } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Material } from './gfx3_mesh_material';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_mesh_shader';

export interface Group {
  id: number,
  startIndex: number,
  endIndex: number,
  smooth: boolean
};

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

  static build(coords: Array<number>, texcoords: Array<number>, indices?: Array<number>, groups?: Array<Group>) {
    const vcoords = new Array<vec3>();
    const vtexs = new Array<vec2>();
    const vnorms = new Array<vec3>();
    const vtangs = new Array<vec3>();
    const vflips = new Array<number>();
    const vbnorms = new Array<vec3>();
    const vnormsByGroup = new Array<Array<vec3>>();
    const vtangsByGroup = new Array<Array<vec3>>();

    groups = groups ?? [{
      id: 0,
      startIndex: 0,
      endIndex: indices ? indices.length / 2 : coords.length / 3,
      smooth: false
    }];

    for (const group of groups) {
      vnormsByGroup[group.id] = [];
      vtangsByGroup[group.id] = [];

      for (let i = group.startIndex; i < group.endIndex; i += 3) {
        const i0 = i;
        const i1 = i + 1;
        const i2 = i + 2;
  
        const cid0 = indices ? indices[i0 * 2 + 0] : i0;
        const cid1 = indices ? indices[i1 * 2 + 0] : i1;
        const cid2 = indices ? indices[i2 * 2 + 0] : i2;
  
        const tid0 = indices ? indices[i0 * 2 + 1] : i0;
        const tid1 = indices ? indices[i1 * 2 + 1] : i1;
        const tid2 = indices ? indices[i2 * 2 + 1] : i2;

        vcoords[i0] = [coords[cid0 * 3 + 0], coords[cid0 * 3 + 1], coords[cid0 * 3 + 2]];
        vcoords[i1] = [coords[cid1 * 3 + 0], coords[cid1 * 3 + 1], coords[cid1 * 3 + 2]];
        vcoords[i2] = [coords[cid2 * 3 + 0], coords[cid2 * 3 + 1], coords[cid2 * 3 + 2]];
  
        vtexs[i0] = [texcoords[tid0 * 2 + 0], texcoords[tid0 * 2 + 1]];
        vtexs[i1] = [texcoords[tid1 * 2 + 0], texcoords[tid1 * 2 + 1]];
        vtexs[i2] = [texcoords[tid2 * 2 + 0], texcoords[tid2 * 2 + 1]];

        const v01 = UT.VEC3_SUBSTRACT(vcoords[i1], vcoords[i0]);
        const v02 = UT.VEC3_SUBSTRACT(vcoords[i2], vcoords[i0]);

        const uv01 = UT.VEC2_SUBSTRACT(vtexs[i1], vtexs[i0]);
        const uv02 = UT.VEC2_SUBSTRACT(vtexs[i2], vtexs[i0]);

        const fnorm = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(v01, v02));
        vnorms[i0] = fnorm;
        vnorms[i1] = fnorm;
        vnorms[i2] = fnorm;

        if (group.smooth) {
          vnormsByGroup[group.id][cid0] = vnormsByGroup[group.id][cid0] ? UT.VEC3_ADD(vnormsByGroup[group.id][cid0], fnorm) : fnorm;
          vnormsByGroup[group.id][cid1] = vnormsByGroup[group.id][cid1] ? UT.VEC3_ADD(vnormsByGroup[group.id][cid1], fnorm) : fnorm;
          vnormsByGroup[group.id][cid2] = vnormsByGroup[group.id][cid2] ? UT.VEC3_ADD(vnormsByGroup[group.id][cid2], fnorm) : fnorm;
        }

        const ftang: vec3 = [0, 0, 0];
        const fflip = COMPUTE_FACE_TANGENT(v01, v02, uv01, uv02, ftang);
        vflips[i0] = fflip;
        vflips[i1] = fflip;
        vflips[i2] = fflip;
        vtangs[i0] = ftang;
        vtangs[i1] = ftang;
        vtangs[i2] = ftang;

        if (group.smooth) {
          vtangsByGroup[group.id][cid0] = vtangsByGroup[group.id][cid0] ? UT.VEC3_ADD(vtangsByGroup[group.id][cid0], ftang) : ftang;
          vtangsByGroup[group.id][cid1] = vtangsByGroup[group.id][cid1] ? UT.VEC3_ADD(vtangsByGroup[group.id][cid1], ftang) : ftang;
          vtangsByGroup[group.id][cid2] = vtangsByGroup[group.id][cid2] ? UT.VEC3_ADD(vtangsByGroup[group.id][cid2], ftang) : ftang;  
        }
      }  
    }

    const finalVertices = [];

    for (const group of groups) {
      for (let i = group.startIndex; i < group.endIndex; i++) {
        const cid = indices ? indices[i * 2 + 0] : i;

        if (group.smooth) {
          vnorms[i] = UT.VEC3_NORMALIZE(vnormsByGroup[group.id][cid]);
          vtangs[i] = UT.VEC3_NORMALIZE(vtangsByGroup[group.id][cid]);
        }

        vbnorms[i] = UT.VEC3_SCALE(UT.VEC3_CROSS(vnorms[i], vtangs[i]), vflips[i]);
        finalVertices.push(vcoords[i][0], vcoords[i][1], vcoords[i][2], vtexs[i][0], vtexs[i][1], vnorms[i][0], vnorms[i][1], vnorms[i][2], vtangs[i][0], vtangs[i][1], vtangs[i][2], vbnorms[i][0], vbnorms[i][1], vbnorms[i][2]);
      }
    }

    return finalVertices;
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

    const ftang =  UT.VEC3_NORMALIZE([tx, ty, tz]);
    out[0] = ftang[0];
    out[1] = ftang[1];
    out[2] = ftang[2];
    return flip;
  }

  return -1;
}
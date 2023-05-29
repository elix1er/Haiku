import { UT } from '../core/utils';
import { Gfx3Material } from './gfx3_mesh_material';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { Gfx3Mesh } from './gfx3_mesh';
import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';

class Polygon {
  n: number;
  vtx: Array<vec3>;
  uvs: Array<vec2>;
  ns: Array<vec3>;
  nIdxs: Array<number>;
  ts: Array<vec3 | null>;
  bs: Array<vec3 | null>;

  constructor(n: number) {
    this.n = n;
    this.vtx = Array<vec3>(n);
    this.uvs = new Array<vec2>(n);
    this.ns = new Array<vec3>(n);
    this.ts = Array<vec3>(n);
    this.bs = Array<vec3>(n);
    this.nIdxs = Array<number>(n);

    for (let i = 0; i < n; i++) {
      this.ts[i] = null;
      this.bs[i] = null;
    }
  }
}

class Gfx3MeshObj extends Map<string, Gfx3Mesh>{
  materials: Map<string, Gfx3Material>;

  constructor() {
    super();
    this.materials = new Map<string, Gfx3Material>();
  }

  destroy() {
    for (const mesh of this.values()) {
      mesh.delete(true);
    }

    for (const material of this.materials.values()) {
      material.delete();
    }
  }

  async* makeTextFileLineIterator(fileURL: string): AsyncGenerator<string> {
    const utf8Decoder = new TextDecoder('utf-8');
    const response = await fetch(fileURL);

    if (response === null) {
      return '';
    }

    if (response.body === null) {
      return '';
    }

    const reader = response.body.getReader();
    let { value: chunk, done: readerDone } = await reader.read();

    if (!chunk) {
      return '';
    }

    let mychunk = utf8Decoder.decode(chunk);

    const newline = /\r?\n/gm;
    let startIndex = 0;

    while (true) {
      const result = newline.exec(mychunk);
      if (!result) {
        if (readerDone) break;
        const remainder = mychunk.substr(startIndex);
        ({ value: chunk, done: readerDone } = await reader.read());
        mychunk = remainder + utf8Decoder.decode(chunk);
        startIndex = newline.lastIndex = 0;
        continue;
      }
      yield mychunk.substring(startIndex, result.index);
      startIndex = newline.lastIndex;
    }

    if (startIndex < mychunk.length) {
      // Last line didn't end in a newline char
      yield mychunk.substring(startIndex);
    }
  }

  // [v]
  newMaterial(matName: string): Gfx3Material {
    let matFound = this.materials.get(matName);
    if (matFound) {
      return matFound;
    }

    const mat = new Gfx3Material({ lightning: true });
    this.materials.set(matName, mat);
    return mat;
  }

  // [v]
  async loadMaterials(path: string) {
    this.materials = new Map<string, Gfx3Material>();

    let curMat = null;
    let curMatName = null;
    path = path.split('/').slice(0, -1).join('/') + '/';

    for await (const line of this.makeTextFileLineIterator(path)) {
      if (line.startsWith('newmtl ')) {
        curMatName = line.substring(7);
        curMat = this.newMaterial(curMatName);
      }

      if (!curMat) {
        continue;
      }

      if (line.startsWith('Kd ')) {
        const d = UT.VEC3_PARSE(line.substring(3));
        curMat.setDiffuse(d[0], d[1], d[2]);
      }

      if (line.startsWith('Ks ')) {
        const s = UT.VEC3_PARSE(line.substring(3));
        curMat.setSpecular(s[0], s[1], s[2]);
      }

      if (line.startsWith('Ns')) {
        const s = parseFloat(line.substring(3));
        curMat.setSpecularity(s);
      }

      if (line.startsWith('map_Kd ')) {
        const infos = line.substring(7);
        curMat.setTexture(await gfx3TextureManager.loadTexture(path + infos));
      }

      if (line.startsWith('map_Ns ')) {
        const infos = line.substring(7);
        curMat.setSpecularityMap(await gfx3TextureManager.loadTexture8bit(path + infos));
      }

      if (line.startsWith('map_Bump ')) {
        const infos = line.split(' ');
        infos.shift();

        while (infos[0][0] == '-') {
          const flag = infos[0].substring(1);
          infos.shift();

          if (flag == 'bm') {
            /* curMat.normalIntensity = parseFloat(infos[0]); */
            infos.shift();
          }
        }

        const url = infos.join(' ');
        curMat.setNormalMap(await gfx3TextureManager.loadTexture(path + url));
      }
    }
  }

  // [v]
  getBoundingBox(): Gfx3BoundingBox {
    const boxes = new Array<Gfx3BoundingBox>();

    for (const mesh of this.values()) {
      boxes.push(mesh.getBoundingBox());
    }
  
    return Gfx3BoundingBox.merge(boxes);
  }

  async loadObjects(path: string): Promise<void> {
    let verts = new Array<vec3>();
    let vtangs = new Array<vec3>();
    let vbnorms = new Array<vec3>();
    let norms = new Array<vec3>();
    let tcoords = new Array<vec2>();

    let curSmooth = '';
    let faces = null;

    let curName = 'off';
    let curMatName = '';
    let vCnt = 0;

    for await (const line of this.makeTextFileLineIterator(path)) {

      // if (line.startsWith('o ')) {
      //   if (faces) {
      //     /* if not first object, build binormals and mesh for the current object */
      //     let vbnorm = new Array<vec3>();

      //     if (norms) {
      //       for (let i = 0; i < vtang.length; i++) {
      //         if (vtang[i]) {
      //           vtang[i] = UT.VEC4_NORMALIZE3(vtang[i]);
      //           vbnorm[i] = UT.VEC3_SCALE(UT.VEC3_CROSS(norms[i], vtang[i]), vtang[i][3]);
      //         }
      //       }
      //     }
      //     yield this.buildMesh(curName, faces, curMatName, vCnt, vtang, vbnorm);
      //   }

      //   curName = line.substring(2);

      //   /* reset faces and vertex count for the next objects */
      //   faces = null;
      //   vCnt = 0;
      // }

      if (line.startsWith('usemtl ')) {
        if (faces) {
          /* if not first object, build binormals and mesh for the current mesh */
          let vbnorm = new Array<vec3>();
          if (norms) {
            for (let i = 0; i < vtang.length; i++) {
              if (vtang[i]) {
                vtang[i] = UT.VEC4_NORMALIZE3(vtang[i]);
                vbnorm[i] = UT.VEC3_SCALE(UT.VEC3_CROSS(norms[i], vtang[i]), vtang[i][3]);
              }
            }
          }
          yield this.buildMesh(curName, faces, curMatName, vCnt, vtang, vbnorm);
        }

        curMatName = line.substring(7);

        /* reset faces and vertex count for the next objects */
        faces = null;
        vCnt = 0;
      }

      if (line.startsWith('v ')) {
        verts.push(UT.VEC3_PARSE(line.substring(2)));
      }

      if (line.startsWith('vn ')) {
        norms.push(UT.VEC3_PARSE(line.substring(3)));
      }

      if (line.startsWith('vt ')) {
        tcoords.push(UT.VEC2_PARSE(line.substring(3)));
      }

      if (line.startsWith('s ')) {
        curSmooth = line.substring(2);
      }

      if (line.startsWith('f ')) {
        const a = line.substring(2).split(' ');
        const numVertices = a.length === 3 ? 3 : 4;

        const tri = new Polygon(numVertices);
        for (let i = 0; i < numVertices; i++) {
          const ids = a[i].split('/');
          tri.vtx[i] = verts[parseInt(ids[0]) - 1] ?? [0, 0, 0];
          tri.uvs[i] = tcoords[parseInt(ids[1]) - 1] ?? [0, 0];
          tri.ns[i] = norms[parseInt(ids[2]) - 1] ?? [0, 0, 0];
        }

        // const i1 = tri.nIdxs[0];
        // const i2 = tri.nIdxs[1];
        // const i3 = tri.nIdxs[2];

        const v01 = UT.VEC3_SUBSTRACT(tri.vtx[1], tri.vtx[0]);
        const v02 = UT.VEC3_SUBSTRACT(tri.vtx[2], tri.vtx[0]);

        if (tri.uvs[0]) {
          const uv01 = UT.VEC2_SUBSTRACT(tri.uvs[1], tri.uvs[0]);
          const uv02 = UT.VEC2_SUBSTRACT(tri.uvs[2], tri.uvs[0]);
          const uv2xArea = ((uv01[0] * uv02[1]) - (uv01[1] * uv02[0]));

          if (Math.abs(uv2xArea) > UT.EPSILON) {
            const r = 1.0 / uv2xArea;
            const flip = uv2xArea > 0 ? 1 : -1;
            const tx = ((v01[0] * uv02[1]) - (v02[0] * uv01[1])) * r;
            const ty = ((v01[1] * uv02[1]) - (v02[1] * uv01[1])) * r;
            const tz = ((v01[2] * uv02[1]) - (v02[2] * uv01[1])) * r;
            const ftang = UT.VEC4_NORMALIZE3([tx, ty, tz, -flip]);

            for (let i = 0; i < numVertices; i++) {
              vtangs[i1] = vtangs[i1] ? UT.VEC4_ADD3(vtangs[i1], ftang) : ftang;
            }
          }
        }

        vCnt += 3;
        faces.push(tri);
        
        // else {
        //   /* face is a quad */
        //   if (a.length === 4) {

        //     /*first face for the current mesh */
        //     if (!faces)
        //       faces = new Array<Polygon>();

        //     const quad = new Polygon(4);

        //     for (let i = 0; i < 4; i++) {
        //       const ids = a[i].split('/');

        //       if (verts) {
        //         const id = parseInt(ids[0]) - 1;
        //         quad.vtx[i] = verts[id];
        //       }
        //       if (tcoords) {
        //         const id = parseInt(ids[1]) - 1;
        //         quad.uvs[i] = tcoords[id];
        //       } else {
        //         quad.uvs[i] = UT.VEC2_CREATE(0, 0);
        //       }
        //       if (norms) {
        //         const id = parseInt(ids[2]) - 1;
        //         quad.ns[i] = norms[id];
        //         quad.nIdxs[i] = id;
        //       } else {
        //         quad.ns[i] = UT.VEC3_CREATE(0, 0, 1.0);
        //       }
        //     }
        //     /* compute tangeant space */

        //     const i1 = quad.nIdxs[0];
        //     const i2 = quad.nIdxs[1];
        //     const i3 = quad.nIdxs[2];
        //     const i4 = quad.nIdxs[3];

        //     const deltaPos1 = UT.VEC3_SUBSTRACT(quad.vtx[1], quad.vtx[0]);
        //     const deltaPos2 = UT.VEC3_SUBSTRACT(quad.vtx[2], quad.vtx[0]);

        //     /* compute normal from vertices if not present in the file
        //     const fnorm = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(deltaPos1,deltaPos2));
        //     vnorms[i1]  = UT.VEC3_ADD(vnorms[i1], fnorm);
        //     vnorms[i2]  = UT.VEC3_ADD(vnorms[i2], fnorm);
        //     vnorms[i3]  = UT.VEC3_ADD(vnorms[i3], fnorm);
        //     */

        //     if (quad.uvs[0]) {
        //       const deltaUV1 = UT.VEC2_SUBSTRACT(quad.uvs[1], quad.uvs[0]);
        //       const deltaUV2 = UT.VEC2_SUBSTRACT(quad.uvs[2], quad.uvs[0]);

        //       const uv2xArea = ((deltaUV1[0] * deltaUV2[1]) - (deltaUV1[1] * deltaUV2[0]));
        //       if (Math.abs(uv2xArea) > UT.EPSILON) {
        //         const r = 1.0 / uv2xArea;
        //         const flip = uv2xArea > 0 ? 1 : -1;
        //         const tx = ((deltaPos1[0] * deltaUV2[1]) - (deltaPos2[0] * deltaUV1[1])) * r;
        //         const ty = ((deltaPos1[1] * deltaUV2[1]) - (deltaPos2[1] * deltaUV1[1])) * r;
        //         const tz = ((deltaPos1[2] * deltaUV2[1]) - (deltaPos2[2] * deltaUV1[1])) * r;
        //         const ftang = UT.VEC4_NORMALIZE3(UT.VEC4_CREATE(tx, ty, tz, -flip));

        //         vtang[i1] = vtang[i1] ? UT.VEC4_ADD3(vtang[i1], ftang) : ftang;
        //         vtang[i2] = vtang[i2] ? UT.VEC4_ADD3(vtang[i2], ftang) : ftang;
        //         vtang[i3] = vtang[i3] ? UT.VEC4_ADD3(vtang[i3], ftang) : ftang;
        //         vtang[i4] = vtang[i4] ? UT.VEC4_ADD3(vtang[i4], ftang) : ftang;
        //       }
        //     }

        //     vCnt += 6;
        //     faces.push(quad);
        //   }
        // }
      }
    }

    /* compute tangeants for the last object and build the mesh*/
    if (faces) {
      let vbnorm = new Array<vec3>();
      if (norms) {
        for (let i = 0; i < vtang.length; i++) {
          if (vtang[i]) {
            vtang[i] = UT.VEC4_NORMALIZE3(vtang[i]);
            vbnorm[i] = UT.VEC3_SCALE(UT.VEC3_CROSS(norms[i], vtang[i]), vtang[i][3]);
          }
        }
      }
      yield this.buildMesh(curName, faces, curMatName, vCnt, vtang, vbnorm);
    }
  }




  buildMesh(name: string, faces: Array<Polygon>, matName: string, vCnt: number, vtang: Array<vec4>, vbnorm: Array<vec3>) {
    const mesh = new Gfx3Mesh();
    const mat = this.materials.get(matName);

    if (mat)
      mesh.setMaterial(mat);

    mesh.beginVertices(vCnt);

    const nvec = UT.VEC3_CREATE(0, 0, 0);

    for (let i = 0; i < faces.length; i++) {
      const v0 = faces[i].vtx[0];
      const v1 = faces[i].vtx[1];
      const v2 = faces[i].vtx[2];

      const uv0 = faces[i].uvs[0] ? faces[i].uvs[0] : UT.VEC2_CREATE(0, 0);
      const uv1 = faces[i].uvs[1] ? faces[i].uvs[1] : UT.VEC2_CREATE(0, 0);
      const uv2 = faces[i].uvs[2] ? faces[i].uvs[2] : UT.VEC2_CREATE(0, 0);

      const n0 = faces[i].ns[0];
      const n1 = faces[i].ns[1];
      const n2 = faces[i].ns[2];

      const t0 = vtang[faces[i].nIdxs[0]] ? vtang[faces[i].nIdxs[0]] : nvec;
      const t1 = vtang[faces[i].nIdxs[1]] ? vtang[faces[i].nIdxs[1]] : nvec;
      const t2 = vtang[faces[i].nIdxs[2]] ? vtang[faces[i].nIdxs[2]] : nvec;

      const b0 = vbnorm[faces[i].nIdxs[0]] ? vbnorm[faces[i].nIdxs[0]] : nvec;
      const b1 = vbnorm[faces[i].nIdxs[1]] ? vbnorm[faces[i].nIdxs[1]] : nvec;
      const b2 = vbnorm[faces[i].nIdxs[2]] ? vbnorm[faces[i].nIdxs[2]] : nvec;

      mesh.defineVertex(v0[0], v0[1], v0[2], uv0[0], 1.0 - uv0[1], n0[0], n0[1], n0[2], t0[0], t0[1], t0[2], b0[0], b0[1], b0[2]);
      mesh.defineVertex(v1[0], v1[1], v1[2], uv1[0], 1.0 - uv1[1], n1[0], n1[1], n1[2], t1[0], t1[1], t1[2], b1[0], b1[1], b1[2]);
      mesh.defineVertex(v2[0], v2[1], v2[2], uv2[0], 1.0 - uv2[1], n2[0], n2[1], n2[2], t2[0], t2[1], t2[2], b2[0], b2[1], b2[2]);

      if (faces[i].n === 4) {
        const v0 = faces[i].vtx[2];
        const v1 = faces[i].vtx[3];
        const v2 = faces[i].vtx[0];

        const uv0 = faces[i].uvs[2] ? faces[i].uvs[2] : UT.VEC2_CREATE(0, 0);
        const uv1 = faces[i].uvs[3] ? faces[i].uvs[3] : UT.VEC2_CREATE(0, 0);
        const uv2 = faces[i].uvs[0] ? faces[i].uvs[0] : UT.VEC2_CREATE(0, 0);

        const n0 = faces[i].ns[2];
        const n1 = faces[i].ns[3];
        const n2 = faces[i].ns[0];

        const t0 = vtang[faces[i].nIdxs[2]] ? vtang[faces[i].nIdxs[2]] : nvec;
        const t1 = vtang[faces[i].nIdxs[3]] ? vtang[faces[i].nIdxs[3]] : nvec;
        const t2 = vtang[faces[i].nIdxs[0]] ? vtang[faces[i].nIdxs[0]] : nvec;

        const b0 = vbnorm[faces[i].nIdxs[2]] ? vbnorm[faces[i].nIdxs[2]] : nvec;
        const b1 = vbnorm[faces[i].nIdxs[3]] ? vbnorm[faces[i].nIdxs[3]] : nvec;
        const b2 = vbnorm[faces[i].nIdxs[0]] ? vbnorm[faces[i].nIdxs[0]] : nvec;

        mesh.defineVertex(v0[0], v0[1], v0[2], uv0[0], 1.0 - uv0[1], n0[0], n0[1], n0[2], t0[0], t0[1], t0[2], b0[0], b0[1], b0[2]);
        mesh.defineVertex(v1[0], v1[1], v1[2], uv1[0], 1.0 - uv1[1], n1[0], n1[1], n1[2], t1[0], t1[1], t1[2], b1[0], b1[1], b1[2]);
        mesh.defineVertex(v2[0], v2[1], v2[2], uv2[0], 1.0 - uv2[1], n2[0], n2[1], n2[2], t2[0], t2[1], t2[2], b2[0], b2[1], b2[2]);
      }
    }

    mesh.endVertices();

    this.set(name + '-' + matName, mesh);

    return mesh;
  }

  async loadFromFile(objPath: string, matPath: string) {
    await this.loadMaterials(matPath);

    for await (const obj of await this.loadMesh(objPath)) {

    }
  }
}

export { Gfx3MeshObj };
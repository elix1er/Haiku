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

  destroy()
  {
    for(let[n, o] of this){ o.delete(true); }

    for(let[n, m] of this.materials){ m.delete(); }

    

  }

  async* makeTextFileLineIterator(fileURL: string): AsyncGenerator<string> {
    const utf8Decoder = new TextDecoder("utf-8");
    const response = await fetch(fileURL);

    if (response === null)
      return '';

    if (response.body === null)
      return '';

    const reader = response.body.getReader();
    let { value: chunk, done: readerDone } = await reader.read();

    if (!chunk)
      return '';

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
      yield mychunk.substr(startIndex);
    }
  }


  newMaterial(matName: string): Gfx3Material {
    let mat = this.materials.get(matName);
    if (mat)
      return mat;

    mat = new Gfx3Material({ lightning: true, ambiant: UT.VEC4_CREATE(0.01, 0.01, 0.01, 1) });

    this.materials.set(matName, mat);

    return mat;
  }

  async loadMaterials(path: string) {
    let curMat = null;
    let curMatName = null;

    const dir = path.split('/').slice(0, -1).join('/') + '/';

    this.materials = new Map<string, Gfx3Material>();

    for await (const line of this.makeTextFileLineIterator(path)) {

      if (line.startsWith('newmtl ')) {
        curMatName = line.substr(7);
        curMat = this.newMaterial(curMatName);
      }

      /*
      if(line.startsWith('Ka '))
      {
          if(curMat)
              curMat.ambiant = UT.VEC4_PARSE(line.substr(3));
      }
      */

      if (line.startsWith('Kd ')) {
        if (curMat)
          curMat.diffuse = new  Float32Array(UT.VEC4_PARSE(line.substr(3)));
      }

      if (line.startsWith('Ks ')) {
        if (curMat) {
          const s = UT.VEC3_PARSE(line.substr(3));
          curMat.specular[0] = s[0];
          curMat.specular[1] = s[1];
          curMat.specular[2] = s[2];
        }

      }

      if (line.startsWith('Ke ')) {
        /*
        if (curMat)
          curMat.emissive = new Float32Array(UT.VEC3_PARSE(line.substr(3)));
        */
      }
      if (line.startsWith('Ns')) {
        if (curMat)
          curMat.specular[3] = parseFloat(line.substr(3));
      }
      if (line.startsWith('Ni ')) {
        /*
        if (curMat)
          curMat.normalIntensity = parseFloat(line.substr(3));
        */
      }

      if (line.startsWith('map_Kd ')) {
        const infos = line.substr(7);

        if (curMat) {
          try {
            curMat.texture = await gfx3TextureManager.loadTexture(dir + infos);
          }
          catch (e) {
            console.log('Gfx3MeshObj loadMaterials ' + line + ' ' + infos);
          }
        }

      }

      if (line.startsWith('map_Bump ')) {
        const infos = line.split(' ');
        infos.shift();

        while (infos[0][0] == '-') {
          const sw = infos[0].substr(1);
          if (sw == 'bm') {
            infos.shift();

            /*
            if (curMat)
              curMat.normalIntensity = parseFloat(infos[0]);
            */

            infos.shift();
          }

        }

        const url = infos.join(' ');

        if (curMat) {
          try {
            curMat.normalMap = await gfx3TextureManager.loadTexture(dir + url);
          }
          catch (e) {
            console.log('Gfx3MeshObj loadMaterials ' + line + ' ' + url);
          }

        }

      }


    }
  }


  async* loadMesh(path: string): AsyncGenerator<Gfx3Mesh> {
    let verts = null;
    let vtang = null;
    let vbnorm = null;
    let norms = null;
    let faces = null;
    let tcoords = null;
    let curName = '';
    let curMatName = '';
    let vCnt = 0;

    vtang = new Array<vec3>();;
    vbnorm = new Array<vec3>();;

    for await (const line of this.makeTextFileLineIterator(path)) {

      if (line.startsWith('o ')) {
        if (faces) {
          yield this.buildMesh(curName, faces, curMatName, vCnt, vtang, vbnorm);
        }
        curName = line.substr(2);
        faces = null;
        vCnt = 0;
      }

      if (line.startsWith('usemtl ')) {
        if (faces) {
          yield this.buildMesh(curName, faces, curMatName, vCnt, vtang, vbnorm);
        }

        curMatName = line.substr(7);
        faces = null;
        vCnt = 0;
      }

      if (line.startsWith('v ')) {
        if (!verts)
          verts = new Array<vec3>();

        verts.push(UT.VEC3_PARSE(line.substr(2)));
      }
      if (line.startsWith('vn ')) {
        if (!norms)
          norms = new Array<vec3>();

        norms.push(UT.VEC3_PARSE(line.substr(3)));
      }
      if (line.startsWith('vt ')) {
        if (!tcoords)
          tcoords = new Array<vec2>();

        tcoords.push(UT.VEC2_PARSE(line.substr(3)));
      }

      if (line.startsWith('f ')) {

        const a = line.substr(2).split(' ');

        if (a.length === 3) {
          if (!faces)
            faces = new Array<Polygon>();

          const tri = new Polygon(3);

          for (let i = 0; i < 3; i++) {
            const ids = a[i].split('/');

            if (verts) {
              const id = parseInt(ids[0]) - 1;
              tri.vtx[i] = verts[id];
            }

            if (tcoords) {
              const id = parseInt(ids[1]) - 1;
              tri.uvs[i] = tcoords[id];
            } else {
              tri.uvs[i] = UT.VEC2_CREATE(0, 0);
            }

            if (norms) {
              const id = parseInt(ids[2]) - 1;
              tri.ns[i] = norms[id];
              tri.nIdxs[i] = id;
            } else {
              tri.ns[i] = UT.VEC3_CREATE(0, 1, 0);
            }

          }

          const i1 = tri.nIdxs[0];
          const i2 = tri.nIdxs[1];
          const i3 = tri.nIdxs[2];

          const deltaPos1 = UT.VEC3_SUBSTRACT(tri.vtx[1], tri.vtx[0]);
          const deltaPos2 = UT.VEC3_SUBSTRACT(tri.vtx[2], tri.vtx[0]);

          const deltaUV1 = UT.VEC2_SUBSTRACT(tri.uvs[1], tri.uvs[0]);
          const deltaUV2 = UT.VEC2_SUBSTRACT(tri.uvs[2], tri.uvs[0]);

          /*
          const fnorm = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(deltaPos1,deltaPos2));
          vnorms[i1]  = UT.VEC3_ADD(vnorms[i1], fnorm);
          vnorms[i2]  = UT.VEC3_ADD(vnorms[i2], fnorm);
          vnorms[i3]  = UT.VEC3_ADD(vnorms[i3], fnorm);
          */

          const r = 1.0 / ((deltaUV1[0] * deltaUV2[1]) - (deltaUV1[1] * deltaUV2[0]));

          const tx = ((deltaPos1[0] * deltaUV2[1]) - (deltaPos2[0] * deltaUV1[1])) * r;
          const ty = ((deltaPos1[1] * deltaUV2[1]) - (deltaPos2[1] * deltaUV1[1])) * r;
          const tz = ((deltaPos1[2] * deltaUV2[1]) - (deltaPos2[2] * deltaUV1[1])) * r;

          const ftang = UT.VEC3_NORMALIZE(UT.VEC3_CREATE(tx, ty, tz));

          vtang[i1] = vtang[i1] ? UT.VEC3_ADD(vtang[i1], ftang) : ftang;
          vtang[i2] = vtang[i2] ? UT.VEC3_ADD(vtang[i2], ftang) : ftang;
          vtang[i3] = vtang[i3] ? UT.VEC3_ADD(vtang[i3], ftang) : ftang;

          const bx = ((deltaPos2[0] * deltaUV1[0]) - (deltaPos1[0] * deltaUV2[0])) * r;
          const by = ((deltaPos2[1] * deltaUV1[0]) - (deltaPos1[1] * deltaUV2[0])) * r;
          const bz = ((deltaPos2[2] * deltaUV1[0]) - (deltaPos1[2] * deltaUV2[0])) * r;

          const fbnorm = UT.VEC3_NORMALIZE(UT.VEC3_CREATE(bx, by, bz));

          vbnorm[i1] = vbnorm[i1] ? UT.VEC3_ADD(vbnorm[i1], fbnorm) : fbnorm;
          vbnorm[i2] = vbnorm[i2] ? UT.VEC3_ADD(vbnorm[i2], fbnorm) : fbnorm;
          vbnorm[i3] = vbnorm[i3] ? UT.VEC3_ADD(vbnorm[i3], fbnorm) : fbnorm;
          vCnt += 3;

          faces.push(tri);
        } else if (a.length === 4) {

          if (!faces)
            faces = new Array<Polygon>();

          const tri = new Polygon(4);

          for (let i = 0; i < 4; i++) {
            const ids = a[i].split('/');

            if (verts) {
              const id = parseInt(ids[0]) - 1;
              tri.vtx[i] = verts[id];
            }

            if (tcoords) {
              const id = parseInt(ids[1]) - 1;
              tri.uvs[i] = tcoords[id];
            } else {
              tri.uvs[i] = UT.VEC2_CREATE(0, 0);
            }

            if (norms) {
              const id = parseInt(ids[2]) - 1;
              tri.ns[i] = norms[id];
              tri.nIdxs[i] = id;
            } else {
              tri.ns[i] = UT.VEC3_CREATE(0, 0, 1.0);
            }
          }

          for (let t = 0; t < 2; t++) {
            const i1 = (t == 0) ? tri.nIdxs[0] : tri.nIdxs[3];
            const i2 = (t == 0) ? tri.nIdxs[1] : tri.nIdxs[2];
            const i3 = (t == 0) ? tri.nIdxs[2] : tri.nIdxs[1];

            const deltaPos1 = UT.VEC3_SUBSTRACT(tri.vtx[1], tri.vtx[0]);
            const deltaPos2 = UT.VEC3_SUBSTRACT(tri.vtx[2], tri.vtx[0]);

            const deltaUV1 = UT.VEC2_SUBSTRACT(tri.uvs[1], tri.uvs[0]);
            const deltaUV2 = UT.VEC2_SUBSTRACT(tri.uvs[2], tri.uvs[0]);

            /*
            const fnorm = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(deltaPos1,deltaPos2));
            vnorms[i1]  = UT.VEC3_ADD(vnorms[i1], fnorm);
            vnorms[i2]  = UT.VEC3_ADD(vnorms[i2], fnorm);
            vnorms[i3]  = UT.VEC3_ADD(vnorms[i3], fnorm);
            */

            const r = 1.0 / ((deltaUV1[0] * deltaUV2[1]) - (deltaUV1[1] * deltaUV2[0]));

            const tx = ((deltaPos1[0] * deltaUV2[1]) - (deltaPos2[0] * deltaUV1[1])) * r;
            const ty = ((deltaPos1[1] * deltaUV2[1]) - (deltaPos2[1] * deltaUV1[1])) * r;
            const tz = ((deltaPos1[2] * deltaUV2[1]) - (deltaPos2[2] * deltaUV1[1])) * r;

            const ftang = UT.VEC3_NORMALIZE(UT.VEC3_CREATE(tx, ty, tz));

            vtang[i1] = vtang[i1] ? UT.VEC3_ADD(vtang[i1], ftang) : ftang;
            vtang[i2] = vtang[i2] ? UT.VEC3_ADD(vtang[i2], ftang) : ftang;
            vtang[i3] = vtang[i3] ? UT.VEC3_ADD(vtang[i3], ftang) : ftang;

            const bx = ((deltaPos2[0] * deltaUV1[0]) - (deltaPos1[0] * deltaUV2[0])) * r;
            const by = ((deltaPos2[1] * deltaUV1[0]) - (deltaPos1[1] * deltaUV2[0])) * r;
            const bz = ((deltaPos2[2] * deltaUV1[0]) - (deltaPos1[2] * deltaUV2[0])) * r;

            const fbnorm = UT.VEC3_NORMALIZE(UT.VEC3_CREATE(bx, by, bz));

            vbnorm[i1] = vbnorm[i1] ? UT.VEC3_ADD(vbnorm[i1], fbnorm) : fbnorm;
            vbnorm[i2] = vbnorm[i2] ? UT.VEC3_ADD(vbnorm[i2], fbnorm) : fbnorm;
            vbnorm[i3] = vbnorm[i3] ? UT.VEC3_ADD(vbnorm[i3], fbnorm) : fbnorm;
          }


          vCnt += 6;
          faces.push(tri);
        }
      }
    }

    if (faces) {
      yield this.buildMesh(curName, faces, curMatName, vCnt, vtang, vbnorm);
    }
  }

  getBoundingBox() {
    const boxes = new Array<Gfx3BoundingBox>();
    const objs = this.values();

    for (const o of objs) {
      boxes.push(o.boundingBox);
    }

    return Gfx3BoundingBox.merge(boxes);
  }


  buildMesh(name: string, faces: Array<Polygon>, matName: string, vCnt: number, vtang: Array<vec3>, vbnorm: Array<vec3>) {

    const mesh = new Gfx3Mesh();

    const mat = this.materials.get(matName);

    for (let i = 0; i < vtang.length; i++) {
      if (vtang[i]) vtang[i] = UT.VEC3_NORMALIZE(vtang[i]);
      if (vbnorm[i]) vbnorm[i] = UT.VEC3_NORMALIZE(vbnorm[i]);
    }

    if (mat)
      mesh.setMaterial(mat);

    mesh.beginVertices(vCnt);

    for (let i = 0; i < faces.length; i++) {
      const v0 = faces[i].vtx[0];
      const v1 = faces[i].vtx[1];
      const v2 = faces[i].vtx[2];

      const uv0 = faces[i].uvs[0];
      const uv1 = faces[i].uvs[1];
      const uv2 = faces[i].uvs[2];

      const n0 = faces[i].ns[0];
      const n1 = faces[i].ns[1];
      const n2 = faces[i].ns[2];

      const t0 = vtang[faces[i].nIdxs[0]];
      const t1 = vtang[faces[i].nIdxs[1]];
      const t2 = vtang[faces[i].nIdxs[2]];

      const b0 = vbnorm[faces[i].nIdxs[0]];
      const b1 = vbnorm[faces[i].nIdxs[1]];
      const b2 = vbnorm[faces[i].nIdxs[2]];

      mesh.defineVertex(v0[0], v0[1], v0[2], uv0[0], 1.0 - uv0[1], n0[0], n0[1], n0[2], t0[0], t0[1], t0[2], b0[0], b0[1], b0[2]);
      mesh.defineVertex(v1[0], v1[1], v1[2], uv1[0], 1.0 - uv1[1], n1[0], n1[1], n1[2], t1[0], t1[1], t1[2], b1[0], b1[1], b1[2]);
      mesh.defineVertex(v2[0], v2[1], v2[2], uv2[0], 1.0 - uv2[1], n2[0], n2[1], n2[2], t2[0], t2[1], t2[2], b2[0], b2[1], b2[2]);

      if (faces[i].n === 4) {
        const v0 = faces[i].vtx[3];
        const v1 = faces[i].vtx[2];
        const v2 = faces[i].vtx[1];

        const uv0 = faces[i].uvs[3];
        const uv1 = faces[i].uvs[2];
        const uv2 = faces[i].uvs[1];

        const n0 = faces[i].ns[3];
        const n1 = faces[i].ns[2];
        const n2 = faces[i].ns[1];

        mesh.defineVertex(v0[0], v0[1], v0[2], uv0[0], 1.0 - uv0[1], n0[0], n0[1], n0[2], 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        mesh.defineVertex(v1[0], v1[1], v1[2], uv1[0], 1.0 - uv1[1], n1[0], n1[1], n1[2], 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        mesh.defineVertex(v2[0], v2[1], v2[2], uv2[0], 1.0 - uv2[1], n2[0], n2[1], n2[2], 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
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
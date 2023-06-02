import { UT } from '../core/utils';
import { Gfx3Material } from './gfx3_mesh_material';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { Gfx3Mesh, Group } from './gfx3_mesh';
import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';

class OBJObject {
  name: string;
  coords: Array<vec3>;
  texcoords: Array<vec2>;
  indices: Array<number>;
  groups: Array<Group>;
  materialName: string;

  constructor() {
    this.name = '';
    this.coords = new Array<vec3>();
    this.texcoords = new Array<vec2>();
    this.indices = new Array<number>();
    this.groups = new Array<Group>();
    this.materialName = '';
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

  // [v]
  getBoundingBox(): Gfx3BoundingBox {
    const boxes = new Array<Gfx3BoundingBox>();

    for (const mesh of this.values()) {
      boxes.push(mesh.getBoundingBox());
    }
  
    return Gfx3BoundingBox.merge(boxes);
  }

  // [v]
  async loadMaterials(path: string) {
    const response = await fetch(path);
    const text = await response.text();
    const lines = text.split('\n');

    this.materials.clear();

    let curMat = null;
    let curMatName = null;
    path = path.split('/').slice(0, -1).join('/') + '/';

    for (const line of lines) {
      if (line.startsWith('newmtl ')) {
        curMatName = line.substring(7);
        curMat = new Gfx3Material({ lightning: true });
        this.materials.set(curMatName, curMat);
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

  async loadObjects(path: string): Promise<void> {
    const response = await fetch(path);
    const text = await response.text();
    const lines = text.split('\n');

    let objects = new Array<OBJObject>();
    let currentObject = new OBJObject();
    let currentGroup: Group = { id: 0, startIndex: 0, endIndex: 0, smooth: false };
    let vCnt = 0;

    for (const line of lines) {
      if (line.startsWith('o ')) {
        const object = new OBJObject();
        object.name = line.substring(2);
        currentObject = object;
        objects.push(object);
        vCnt = 0;
      }

      if (line.startsWith('usemtl ')) {
        currentObject.materialName = line.substring(7);
      }

      if (line.startsWith('v ')) {
        currentObject.coords.push(UT.VEC3_PARSE(line.substring(2)));
      }

      if (line.startsWith('vt ')) {
        currentObject.texcoords.push(UT.VEC2_PARSE(line.substring(3)));
      }

      if (line.startsWith('s ')) {
        const a = line.substring(2);
        const group: Group = { id: a == 'off' ? 0 : parseInt(a), startIndex: vCnt, endIndex: 0, smooth: a != 'off' };
        currentGroup = group;
        currentObject.groups.push(group);
      }

      if (line.startsWith('f ')) {
        const a = line.substring(2).split(' ');
        if (a.length > 3) {
          throw new Error('Gfx3MeshOBJ::loadObjects(): Not support non-triangulate faces !');
        }

        for (let i = 0; i < 3; i++) {
          const ids = a[i].split('/');
          const cid = parseInt(ids[0]) - 1;
          const tid = parseInt(ids[1]) - 1;
          currentObject.indices.push(cid, tid);
          currentGroup.endIndex = ++vCnt;
        }
      }
    }

    for (const object of objects) {
      const mesh = new Gfx3Mesh();
      const material = this.materials.get(object.materialName);

      if (material) {
        mesh.setMaterial(material);
      }

      const vertices = Gfx3Mesh.build(object.coords, object.texcoords, object.indices, object.groups);

      mesh.beginVertices(x);
      mesh.setVertices(vertices, x);
      mesh.endVertices();
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

  async loadFromFile(objPath: string, mtlPath: string) {
    await this.loadMaterials(mtlPath);
    await this.loadObjects(objPath);
  }
}

export { Gfx3MeshObj };
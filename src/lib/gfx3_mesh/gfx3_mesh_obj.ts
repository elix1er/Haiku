import { UT } from '../core/utils';
import { Gfx3Material } from './gfx3_mesh_material';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { Gfx3Mesh, Group } from './gfx3_mesh';
import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';

class OBJObject {
  name: string;
  coords: Array<number>;
  texcoords: Array<number>;
  indices: Array<number>;
  groups: Array<Group>;
  materialName: string;
  vCount: number;

  constructor() {
    this.name = '';
    this.coords = new Array<number>();
    this.texcoords = new Array<number>();
    this.indices = new Array<number>();
    this.groups = new Array<Group>();
    this.materialName = '';
    this.vCount = 0;
  }
}

class Gfx3MeshObj extends Map<string, Gfx3Mesh> {
  materials: Map<string, Gfx3Material>;
  meshes: Map<string, Gfx3Mesh>;

  constructor() {
    super();
    this.materials = new Map<string, Gfx3Material>();
    this.meshes = new Map<string, Gfx3Mesh>();
  }

  destroy() {
    for (const mesh of this.meshes.values()) {
      mesh.delete(true);
    }

    for (const material of this.materials.values()) {
      material.delete();
    }
  }

  getBoundingBox(): Gfx3BoundingBox {
    const boxes = new Array<Gfx3BoundingBox>();

    for (const mesh of this.meshes.values()) {
      boxes.push(mesh.getBoundingBox());
    }
  
    return Gfx3BoundingBox.merge(boxes);
  }

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

    for (const line of lines) {
      if (line.startsWith('o ')) {
        const object = new OBJObject();
        object.name = line.substring(2);
        currentObject = object;
        objects.push(object);
      }

      if (line.startsWith('usemtl ')) {
        currentObject.materialName = line.substring(7);
      }

      if (line.startsWith('v ')) {
        const c = UT.VEC3_PARSE(line.substring(2));
        currentObject.coords.push(c[0], c[1], c[2]);
      }

      if (line.startsWith('vt ')) {
        const t = UT.VEC2_PARSE(line.substring(3));
        currentObject.texcoords.push(t[0], t[1]);
      }

      if (line.startsWith('s ')) {
        const a = line.substring(2);
        const group: Group = { id: a == 'off' ? 0 : parseInt(a), startIndex: currentObject.vCount, endIndex: 0, smooth: a != 'off' };
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
          currentObject.vCount++;
          currentGroup.endIndex = currentObject.vCount;
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

      mesh.beginVertices(object.vCount);
      mesh.setVertices(vertices, object.vCount);
      mesh.endVertices();

      this.meshes.set(object.name, mesh);
    }
  }

  async loadFromFile(objPath: string, mtlPath: string) {
    await this.loadMaterials(mtlPath);
    await this.loadObjects(objPath);
  }
}

export { Gfx3MeshObj };
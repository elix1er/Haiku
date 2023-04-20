import { Gfx3Mesh } from './gfx3_mesh';
import { Utils } from '../core/utils';

class Gfx3MeshJSM extends Gfx3Mesh {
  constructor() {
    super();
  }

  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JSM') {
      throw new Error('Gfx3MeshJSM::loadFromFile(): File not valid !');
    }

    this.beginVertices(json['NumVertices']);

    for (let i = 0; i < json['NumVertices']; i += 3) {
      const v0 = json['Vertices'].slice((i * 3) + 0, (i * 3) + 3);
      const v1 = json['Vertices'].slice((i * 3) + 3, (i * 3) + 6);
      const v2 = json['Vertices'].slice((i * 3) + 6, (i * 3) + 9);

      const uv0 = json['TextureCoords'].slice((i * 2) + 0, (i * 2) + 2);
      const uv1 = json['TextureCoords'].slice((i * 2) + 2, (i * 2) + 4);
      const uv2 = json['TextureCoords'].slice((i * 2) + 4, (i * 2) + 6);

      const n0 = json['Normals'].slice((i * 3) + 0, (i * 3) + 3);
      const n1 = json['Normals'].slice((i * 3) + 3, (i * 3) + 6);
      const n2 = json['Normals'].slice((i * 3) + 6, (i * 3) + 9);

      const deltaPos1 = Utils.VEC3_SUBSTRACT(v1, v0);
      const deltaPos2 = Utils.VEC3_SUBSTRACT(v2, v0);

      const deltaUV1 = Utils.VEC2_SUBSTRACT(uv1, uv0);
      const deltaUV2 = Utils.VEC2_SUBSTRACT(uv2, uv0);

      const r = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);

      const tx = (deltaPos1[0] * deltaUV2[1] - deltaPos2[0] * deltaUV1[1]) * r;
      const ty = (deltaPos1[1] * deltaUV2[1] - deltaPos2[1] * deltaUV1[1]) * r;
      const tz = (deltaPos1[2] * deltaUV2[1] - deltaPos2[2] * deltaUV1[1]) * r;

      const binormx = (deltaPos2[0] * deltaUV1[0] - deltaPos1[0] * deltaUV2[0]) * r;
      const binormy = (deltaPos2[1] * deltaUV1[0] - deltaPos1[1] * deltaUV2[0]) * r;
      const binormz = (deltaPos2[2] * deltaUV1[0] - deltaPos1[2] * deltaUV2[0]) * r;

      this.defineVertex(v0[0], v0[1], v0[2], uv0[0], uv0[1], n0[0], n0[1], n0[2], 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
      this.defineVertex(v1[0], v1[1], v1[2], uv1[0], uv1[1], n1[0], n1[1], n1[2], 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
      this.defineVertex(v2[0], v2[1], v2[2], uv2[0], uv2[1], n2[0], n2[1], n2[2], 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }

    this.endVertices();
  }
}

export { Gfx3MeshJSM };
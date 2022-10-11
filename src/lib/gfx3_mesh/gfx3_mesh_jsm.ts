import { Gfx3Mesh } from './gfx3_mesh';

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

    for (let i = 0; i < json['NumVertices']; i++) {
      const vx = json['Vertices'][i * 3 + 0];
      const vy = json['Vertices'][i * 3 + 1];
      const vz = json['Vertices'][i * 3 + 2];
      const ux = json['TextureCoords'][i * 2 + 0];
      const uy = json['TextureCoords'][i * 2 + 1];
      const nx = json['Normals'][i * 3 + 0];
      const ny = json['Normals'][i * 3 + 1];
      const nz = json['Normals'][i * 3 + 2];
      this.defineVertex(vx, vy, vz, ux, uy, nx, ny, nz, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }

    this.endVertices();
  }
}

export { Gfx3MeshJSM };
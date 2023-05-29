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

    const vertices = Gfx3Mesh.build(json['Vertices'], json['TextureCoords'], json['Normals']);

    this.beginVertices(vertices.length);

    for (const v of vertices) {
      this.defineVertex(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[11], v[12], v[13]);
    }

    this.endVertices();
  }
}

export { Gfx3MeshJSM };
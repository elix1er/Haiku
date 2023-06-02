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

    const vertices = Gfx3Mesh.build(json['Vertices'], json['TextureCoords']);

    this.beginVertices(json['NumVertices']);
    this.setVertices(vertices, json['NumVertices']);
    this.endVertices();
  }
}

export { Gfx3MeshJSM };
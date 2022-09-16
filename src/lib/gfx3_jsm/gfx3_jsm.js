import { gfx3Manager } from '../gfx3/gfx3_manager.js';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';

class Gfx3JSM extends Gfx3Drawable {
  constructor() {
    super();
    this.texture = gfx3TextureManager.getTexture('');
  }

  async loadFromFile(path) {
    let response = await fetch(path);
    let json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JSM') {
      throw new Error('Gfx3JSM::loadFromFile(): File not valid !');
    }

    this.clearVertices();

    for (let i = 0; i < json['NumVertices']; i++) {
      let vx = json['Vertices'][i * 3 + 0];
      let vy = json['Vertices'][i * 3 + 1];
      let vz = json['Vertices'][i * 3 + 2];
      let tx = json['TextureCoords'][i * 2 + 0];
      let ty = json['TextureCoords'][i * 2 + 1];
      this.defineVertex(vx, vy, vz, tx, ty);
    }

    this.commitVertices();
  }

  draw() {
    gfx3Manager.drawMesh(this.getModelMatrix(), this.vertexCount, this.vertices, this.texture);
  }

  getTexture() {
    return this.texture;
  }

  setTexture(texture) {
    this.texture = texture;
  }
}

export { Gfx3JSM };
import { gfx3Manager } from '../gfx3/gfx3_manager.js';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable.js';

class Gfx3JSM extends Gfx3Drawable {
  constructor() {
    super();

    this.materialID = gfx3Manager.newMaterial([1.0,1.0,1.0,1.0] , null, null);
  }

  flipFaces()
  {

    let vCopy = [];
    let vCnt = this.vertexCount;

    for (let i = 0; i < vCnt * this.vertSizeF; i++) {
      vCopy[i] = this.vertices[i];
    }
    
    this.clearVertices();
    
    for(let i=0;i<vCnt;i+=3)
    {
      let v1=(i+2)*this.vertSizeF;
      let v2=(i+1)*this.vertSizeF;
      let v3=(i+0)*this.vertSizeF;

      this.defineVertex(vCopy[v1+0], vCopy[v1+1], vCopy[v1+2], vCopy[v1+3], vCopy[v1+4]);
      this.defineVertex(vCopy[v2+0], vCopy[v2+1], vCopy[v2+2], vCopy[v2+3], vCopy[v2+4]);
      this.defineVertex(vCopy[v3+0], vCopy[v3+1], vCopy[v3+2], vCopy[v3+3], vCopy[v3+4]);
    }
    
    this.commitVertices();



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
    gfx3Manager.drawMesh(this.getModelMatrix(),this.getNormalMatrix(), this.materialID,  this.bufferOffsetId, this.vertexCount, this.vertSize);

  }
}

export {Gfx3JSM};
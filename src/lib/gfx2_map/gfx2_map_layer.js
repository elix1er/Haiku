import { Gfx2Drawable } from '../gfx2/gfx2_drawable.js';
import { gfx2Manager } from '../gfx2/gfx2_manager.js';

class Gfx2MapLayer extends Gfx2Drawable {
  constructor(map, layerIndex) {
    super();
    this.map = map;
    this.layerIndex = layerIndex;
    this.frame = 0;
    this.frameProgress = 0;
  }

  update(ts) {
    let layer = this.map.getTileLayer(this.layerIndex);
    if (!layer) {
      return;
    }

    if (this.frameProgress > layer.getFrameDuration()) {
      this.frame = this.frame + 1;
      this.frameProgress = 0;
    }

    this.frameProgress += ts;
  }

  paint(ts) {
    let layer = this.map.getTileLayer(this.layerIndex);
    if (!layer) {
      return;
    }
    if (!layer.isVisible()) {
      return;
    }

    let ctx = gfx2Manager.getContext();
    let tileset = this.map.getTileset();

    for (let col = 0; col < layer.getColumns(); col++) {
      for (let row = 0; row < layer.getRows(); row++) {
        let tileId = layer.getTile(col, row);
        if (tileset.getAnimation(tileId)) {
          let animation = tileset.getAnimation(tileId);
          tileId = animation[this.frame % animation.length];
        }
  
        ctx.drawImage(
          tileset.getTexture(),
          tileset.getTilePositionX(tileId),
          tileset.getTilePositionY(tileId),
          tileset.getTileWidth(),
          tileset.getTileHeight(),
          Math.round(col * this.map.getTileWidth()),
          Math.round(row * this.map.getTileHeight()),
          this.map.getTileWidth(),
          this.map.getTileHeight()
        );
      }
    }
  }
}

export { Gfx2MapLayer };
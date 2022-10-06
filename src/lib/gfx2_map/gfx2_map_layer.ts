import { gfx2Manager } from '../gfx2/gfx2_manager';
import { Gfx2Drawable } from '../gfx2/gfx2_drawable';
import { Gfx2Map } from './gfx2_map';

class Gfx2MapLayer extends Gfx2Drawable {
  map: Gfx2Map;
  layerIndex: number;
  frameIndex: number;
  frameProgress: number;

  constructor(map: Gfx2Map, layerIndex: number) {
    super();
    this.map = map;
    this.layerIndex = layerIndex;
    this.frameIndex = 0;
    this.frameProgress = 0;
  }

  update(ts: number): void {
    const layer = this.map.getTileLayer(this.layerIndex);
    if (!layer) {
      return;
    }

    if (this.frameProgress > layer.getFrameDuration()) {
      this.frameIndex = this.frameIndex + 1;
      this.frameProgress = 0;
    }

    this.frameProgress += ts;
  }

  paint(): void {
    const layer = this.map.getTileLayer(this.layerIndex);
    if (!layer) {
      return;
    }
    if (!layer.isVisible()) {
      return;
    }

    const ctx = gfx2Manager.getContext();
    const tileset = this.map.getTileset();

    for (let col = 0; col < layer.getColumns(); col++) {
      for (let row = 0; row < layer.getRows(); row++) {
        let tileId = layer.getTile(col, row);
        const animation = tileset.getAnimation(tileId);
        if (animation) {
          tileId = animation[this.frameIndex % animation.length];
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
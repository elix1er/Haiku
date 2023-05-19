import { gfx2Manager } from '../../lib/gfx2/gfx2_manager';
import { UT } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx2Drawable } from '../../lib/gfx2/gfx2_drawable';
import { Gfx2Map } from '../../lib/gfx2_map/gfx2_map';
import { Gfx2MapLayer } from '../../lib/gfx2_map/gfx2_map_layer';
import { Pathfinder } from '../../lib/pathfinder/pathfinder';
// ---------------------------------------------------------------------------------------
import { Controller } from './controller';
// ---------------------------------------------------------------------------------------

const LAYER = {
  BACKGROUND: 0,
  MIDDLE: 1,
  FOREGROUND: 2
};

class TilemapPathfindingScreen extends Screen {
  constructor() {
    super();
    this.map = new Gfx2Map();
    this.collisionMap = new Gfx2Map();
    this.layerBackground = new Gfx2MapLayer(this.map, LAYER.BACKGROUND);
    this.layerMiddle = new Gfx2MapLayer(this.map, LAYER.MIDDLE);
    this.layerForeground = new Gfx2MapLayer(this.map, LAYER.FOREGROUND);
    this.controller = new Controller();
    this.selectionRect = new SelectionRect();
  }

  async onEnter() {
    await this.map.loadFromFile('./samples/tilemap/map.json');
    await this.collisionMap.loadFromFile('./samples/tilemap/collision.json');
    await this.controller.loadFromFile('./samples/tilemap/bernard.json');
    this.controller.setPosition(this.map.getPositionX(6), this.map.getPositionY(16));
    this.movePlayer(10, 16);

    document.addEventListener('mousemove', e => this.handleMouseMove(e));
    document.addEventListener('click', () => this.handleMouseClick());
  }

  update(ts) {
    let cameraMinX = gfx2Manager.getWidth() * 0.5;
    let cameraMaxX = this.map.getWidth() - gfx2Manager.getWidth() * 0.5;
    let cameraMinY = gfx2Manager.getHeight() * 0.5;
    let cameraMaxY = this.map.getHeight() - gfx2Manager.getHeight() * 0.5;

    gfx2Manager.setCameraPosition(
      UT.CLAMP(this.controller.getPositionX(), cameraMinX, cameraMaxX),
      UT.CLAMP(this.controller.getPositionY(), cameraMinY, cameraMaxY)
    );

    this.layerBackground.update(ts);
    this.layerMiddle.update(ts);
    this.controller.update(ts);
    this.layerForeground.update(ts);
    this.selectionRect.update(ts);
  }

  draw() {
    this.layerBackground.draw();
    this.layerMiddle.draw();
    this.controller.draw();
    this.layerForeground.draw();
    this.selectionRect.draw();
  }

  movePlayer(endX, endY) {
    let startX = this.collisionMap.getLocationCol(this.controller.getPositionX());
    let startY = this.collisionMap.getLocationRow(this.controller.getPositionY());

    let collisionLayer = this.collisionMap.getTileLayer(0);
    let path = Pathfinder.solve(collisionLayer.getGrid(), collisionLayer.getColumns(), [startX, startY], [endX, endY]);
    if (path) {
      this.controller.moveAlong(path.map(([col, row]) => [
        this.collisionMap.getPositionX(col + 0.5),
        this.collisionMap.getPositionY(row + 0.5)
      ]));
    }
  }

  handleMouseMove(e) {
    let position = gfx2Manager.findWorldPosFromClientPos(e.clientX, e.clientY);
    let x = this.collisionMap.getPositionX(this.collisionMap.getLocationCol(position[0]));
    let y = this.collisionMap.getPositionY(this.collisionMap.getLocationRow(position[1]));
    this.selectionRect.setPosition(x, y);
  }

  handleMouseClick() {
    let col = this.collisionMap.getLocationCol(this.selectionRect.getPositionX());
    let row = this.collisionMap.getLocationRow(this.selectionRect.getPositionY());
    let collisionLayer = this.collisionMap.getTileLayer(0);
    if (collisionLayer.getTile(col, row) == 1) {
      return;
    }

    this.movePlayer(col, row);
  }
}

class SelectionRect extends Gfx2Drawable {
  constructor() {
    super();
  }

  paint() {
    const ctx = gfx2Manager.getContext();
    ctx.fillStyle = 'rgba(225,225,225,0.5)';
    ctx.fillRect(0, 0, 16, 16);
  }
}

export { TilemapPathfindingScreen };
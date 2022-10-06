import { eventManager } from '../../lib/core/event_manager';
import { gfx2Manager } from '../../lib/gfx2/gfx2_manager';
import { Utils } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx2Map } from '../../lib/gfx2_map/gfx2_map';
import { Gfx2MapLayer } from '../../lib/gfx2_map/gfx2_map_layer';
// ---------------------------------------------------------------------------------------
import { Controller } from './controller';
// ---------------------------------------------------------------------------------------

const LAYER = {
  BACKGROUND: 0,
  MIDDLE: 1,
  FOREGROUND: 2
};

class MainScreen extends Screen {
  constructor() {
    super();
    this.map = new Gfx2Map();
    this.collisionMap = new Gfx2Map();
    this.layerBackground = new Gfx2MapLayer(this.map, LAYER.BACKGROUND);
    this.layerMiddle = new Gfx2MapLayer(this.map, LAYER.MIDDLE);
    this.layerForeground = new Gfx2MapLayer(this.map, LAYER.FOREGROUND);
    this.controller = new Controller();
  }

  async onEnter() {
    await this.map.loadFromFile('./samples/tilemap/map.json');
    await this.collisionMap.loadFromFile('./samples/tilemap/collision.json');
    await this.controller.loadFromFile('./samples/tilemap/bernard.json');
    this.controller.setPosition(this.collisionMap.getPositionX(12), this.collisionMap.getPositionY(16));

    eventManager.subscribe(this.controller, 'E_MOVED', this, this.handleControllerMoved);
  }

  update(ts) {
    let cameraMinX = gfx2Manager.getWidth() * 0.5;
    let cameraMaxX = this.map.getWidth() - gfx2Manager.getWidth() * 0.5;
    let cameraMinY = gfx2Manager.getHeight() * 0.5;
    let cameraMaxY = this.map.getHeight() - gfx2Manager.getHeight() * 0.5;

    gfx2Manager.setCameraPosition(
      Utils.CLAMP(this.controller.getPositionX(), cameraMinX, cameraMaxX),
      Utils.CLAMP(this.controller.getPositionY(), cameraMinY, cameraMaxY)
    );

    this.layerBackground.update(ts);
    this.layerMiddle.update(ts);
    this.controller.update(ts);
    this.layerForeground.update(ts);
  }

  draw() {
    this.layerBackground.draw();
    this.layerMiddle.draw();
    this.controller.draw();
    this.layerForeground.draw();
  }

  handleControllerMoved({ prevPositionX, prevPositionY }) {
    let position = this.controller.getPosition();
    let collisionLayer = this.collisionMap.getTileLayer(0);
    if (!collisionLayer) {
      return;
    }

    let loc00X = this.collisionMap.getLocationCol(position[0] + this.controller.getCollider1X());
    let loc00Y = this.collisionMap.getLocationCol(position[1] + this.controller.getCollider1Y());
    let loc01X = this.collisionMap.getLocationCol(position[0] + this.controller.getCollider2X());
    let loc01Y = this.collisionMap.getLocationCol(position[1] + this.controller.getCollider2Y());

    if (collisionLayer.getTile(loc00X, loc00Y) == 1 || collisionLayer.getTile(loc01X, loc01Y) == 1) {
      this.controller.setPosition(prevPositionX, prevPositionY);
    }
  }
}

export { MainScreen };
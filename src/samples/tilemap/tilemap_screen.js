import { inputManager } from '../../lib/input/input_manager';
import { eventManager } from '../../lib/core/event_manager';
import { gfx2Manager } from '../../lib/gfx2/gfx2_manager';
import { UT } from '../../lib/core/utils';
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

const DIRECTION_TO_VEC2 = {
  LEFT: [-1, 0],
  RIGHT: [1, 0],
  FORWARD: [0, -1],
  BACKWARD: [0, 1]
};

class TilemapScreen extends Screen {
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
    let moving = false;
    let direction = 'FORWARD';

    if (inputManager.isActiveAction('LEFT')) {
      moving = true;
      direction = 'LEFT';
    }
    else if (inputManager.isActiveAction('RIGHT')) {
      moving = true;
      direction = 'RIGHT';
    }
    else if (inputManager.isActiveAction('UP')) {
      moving = true;
      direction = 'FORWARD';
    }
    else if (inputManager.isActiveAction('DOWN')) {
      moving = true;
      direction = 'BACKWARD';
    }

    if (moving) {
      let mx = DIRECTION_TO_VEC2[direction][0] * this.controller.getSpeed() * ts;
      let my = DIRECTION_TO_VEC2[direction][1] * this.controller.getSpeed() * ts;
      this.controller.move(mx, my, direction);
      this.controller.play('RUN_' + direction, true);
    }
    else {
      this.controller.play('IDLE_' + this.controller.getDirection(), true);
    }

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
  }

  draw() {
    this.layerBackground.draw();
    this.layerMiddle.draw();
    this.controller.draw();
    this.layerForeground.draw();
  }

  handleControllerMoved({ old, moveX, moveY }) {
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
      this.controller.setPosition(old[0], old[1]);
    }
  }
}

export { TilemapScreen };
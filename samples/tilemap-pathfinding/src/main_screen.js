let { gfx2Manager } = require('./lib/gfx2/gfx2_manager');
let { Utils } = require('./lib/core/utils');
let { Screen } = require('./lib/screen/screen');
let { Gfx2Map } = require('./lib/gfx2_map/gfx2_map');
let { Gfx2MapLayer } = require('./lib/gfx2_map/gfx2_map_layer');
let { AlgoASTAR } = require('./lib/algo_astar/algo_astar');
// ---------------------------------------------------------------------------------------
let { Controller } = require('./controller');
let { SelectionRect } = require('./selection_rect');
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
    this.collisionMap = new Gfx2Map(); // In order to manage collisions more precisely, one should use a map with smaller tiles
    this.layerBackground = new Gfx2MapLayer(this.map, LAYER.BACKGROUND);
    this.layerMiddle = new Gfx2MapLayer(this.map, LAYER.MIDDLE);
    this.layerForeground = new Gfx2MapLayer(this.map, LAYER.FOREGROUND);
    this.controller = new Controller();
    this.selectionRect = new SelectionRect();
  }

  async onEnter() {
    await this.map.loadFromFile('./assets/tilemaps/cave/map.json');
    await this.collisionMap.loadFromFile('./assets/tilemaps/cave/collision.json');
    await this.controller.loadFromFile('./assets/controllers/bernard/data.json');
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
      Utils.CLAMP(this.controller.getPositionX(), cameraMinX, cameraMaxX),
      Utils.CLAMP(this.controller.getPositionY(), cameraMinY, cameraMaxY)
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
    let path = AlgoASTAR.solve(collisionLayer.getGrid(), collisionLayer.getColumns(), [startX, startY], [endX, endY]);
    if (path) {
      this.controller.moveAlong(path.map(([col, row]) => [
        this.collisionMap.getPositionX(col + 0.5),
        this.collisionMap.getPositionY(row + 0.5)
      ]));
    }
  }

  handleMouseMove(e) {
    let position = gfx2Manager.findWorldFromClientPosition(e.clientX, e.clientY);
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

module.exports.MainScreen = MainScreen;
let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
let { Utils } = require('./lib/core/utils');
let { ProjectionModeEnum } = require('./lib/gfx3/gfx3_view');
// ---------------------------------------------------------------------------------------

class Camera {
  constructor() {
    this.targetDrawable = null;
    this.minClipOffset = [0, 0];
    this.maxClipOffset = [0, 0];
    this.view = gfx3Manager.getView(0);

    this.view.setProjectionMode(ProjectionModeEnum.PERSPECTIVE);
    gfx3Manager.setShowDebug(true);
  }

  async loadFromData(data) {
    this.minClipOffset[0] = data['MinClipOffsetX'];
    this.minClipOffset[1] = data['MinClipOffsetY'];
    this.maxClipOffset[0] = data['MaxClipOffsetX'];
    this.maxClipOffset[1] = data['MaxClipOffsetY'];
    this.view.setCameraMatrix(data['Matrix']);
    this.view.setPerspectiveFovy(Utils.DEG_TO_RAD(parseInt(data['Fovy'])));
  }

  update(ts) {
    if (!this.targetDrawable) {
      return;
    }

    let clipOffset = this.view.getClipOffset();
    let targetWorldPosition = this.targetDrawable.getPosition();
    let targetScreenPosition = gfx3Manager.getScreenPosition(0, targetWorldPosition[0], targetWorldPosition[1], targetWorldPosition[2]);

    this.view.setClipOffset(
      Utils.CLAMP(targetScreenPosition[0] + clipOffset[0], this.minClipOffset[0], this.maxClipOffset[0]),
      Utils.CLAMP(targetScreenPosition[1] + clipOffset[1], this.minClipOffset[1], this.maxClipOffset[1])
    );
  }

  setTargetDrawable(targetDrawable) {
    this.targetDrawable = targetDrawable;
  }
}

module.exports.Camera = Camera;
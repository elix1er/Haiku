let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
let { uiManager } = require('./lib/ui/ui_manager');
let { Utils } = require('./lib/core/utils');
let { Screen } = require('./lib/screen/screen');
let { UIDescriptionList } = require('./lib/ui_description_list/ui_description_list');
let { Gfx3Debug } = require('./lib/gfx3/gfx3_debug');
let { Pendulum } = require('./pendulum');
let { Line } = require('./line');


class MainScreen extends Screen {
  constructor() {
    super();
    this.view = gfx3Manager.getView(0);

    // Initial conditions
    this.center = { x: 0, y: 7, z: -13 };
    this.g = 9.81;
    this.l1 = 2;
    this.l2 = 3;
    this.m1 = 30;
    this.m2 = 20;
    this.angle1 = Math.PI;
    this.angle2 = Math.PI + 0.01;
    this.vel1 = 0;
    this.vel2 = 0;
    this.acc1 = 0;
    this.acc2 = 0;

    this.pendulum1 = new Pendulum();
    this.pendulum2 = new Pendulum();
    this.line = new Line({
      color: { r: 0.43, g: 0.08, b: 0.24 },
      max: 400
    });

    this.description1 = new UIDescriptionList();
    uiManager.addWidget(this.description1, 'border: none; min-width: 120px; position: absolute; top: 0; left: 0;');

    this.description2 = new UIDescriptionList();
    uiManager.addWidget(this.description2, 'border: none; min-width: 120px; position: absolute; top: 0; right: 0;');
  }

  async onEnter() {
    gfx3Manager.setShowDebug(true);

    this.pendulum1.setPosition(this.center.x, this.center.y, this.center.z);
    this.pendulum1.setRotation(0, 0, this.angle1);
    this.pendulum1.setScale(1, this.l1 / 2, 1);

    this.pendulum2.setPosition(this.pendulum1.getExtremity());
    this.pendulum2.setRotation(0, 0, this.angle2);
    this.pendulum2.setScale(1, this.l2 / 2, 1);

    this.view.setPosition(0, 6, 0);
    this.view.setBgColor(0.42, 0.48, 0.54, 1);

    await this.pendulum1.init();
    await this.pendulum2.init();

    this.description1.addItem('acc', 'Acceleration 1', 0);
    this.description1.addItem('vel', 'Velocity 1', this.vel1);
    this.description1.addItem('angle', 'Rotation 1', this.angle1);

    this.description2.addItem('acc', 'Acceleration 2', 0);
    this.description2.addItem('vel', 'Velocity 2', this.vel2);
    this.description2.addItem('angle', 'Rotation 2', this.angle2);
  }

  update(ts) {
    /*
     Compute the acceleration using the Euler method
     https://en.wikipedia.org/wiki/Double_pendulum
     https://www.physicsandbox.com/projects/double-pendulum.html
    */
    let mu = 1 + this.m1 / this.m2;

    // Repeat the process as many times as ts is large (16.7 for a base of 60 fps)
    for (let i = 0; i < 6 * (ts / 16.7); i++) {
      this.acc1 = (this.g * (Math.sin(this.pendulum2.getRotationZ()) * Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ()) - mu * Math.sin(this.pendulum1.getRotationZ())) - (this.l2 * 200 * this.vel2 * this.vel2 + this.l1 * 200 * this.vel1 * this.vel1 * Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ())) * Math.sin(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ())) / (this.l1 * 200 * (mu - Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ()) * Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ())));
      this.acc2 = (mu * this.g * (Math.sin(this.pendulum1.getRotationZ()) * Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ()) - Math.sin(this.pendulum2.getRotationZ())) + (mu * this.l1 * 200 * this.vel1 * this.vel1 + this.l2 * 200 * this.vel2 * this.vel2 * Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ())) * Math.sin(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ())) / (this.l2 * 200 * (mu - Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ()) * Math.cos(this.pendulum1.getRotationZ() - this.pendulum2.getRotationZ())));

      this.vel1 += this.acc1 * 0.05;
      this.vel2 += this.acc2 * 0.05;

      this.pendulum1.rotate(0, 0, this.vel1 * 0.05);
      this.pendulum2.rotate(0, 0, this.vel2 * 0.05);
    }

    this.pendulum2.setPosition(...this.pendulum1.getExtremity());

    this.description1.setItem('acc', this.acc1.toFixed(3));
    this.description1.setItem('vel', this.vel1.toFixed(3));
    this.description1.setItem('angle', this.radToDegrees(this.pendulum1.getRotationZ()).toFixed(1) + ' deg');

    this.description2.setItem('acc', this.acc2.toFixed(3));
    this.description2.setItem('vel', this.vel2.toFixed(3));
    this.description2.setItem('angle', this.radToDegrees(this.pendulum2.getRotationZ()).toFixed(1) + ' deg');

    this.pendulum1.update(ts);
    this.pendulum2.update(ts);
    this.line.update(ts);
    this.description1.update(ts);
    this.description2.update(ts);

    this.line.addPoint(...this.pendulum2.getExtremity());
  }

  draw() {
    this.pendulum1.draw();
    this.pendulum2.draw();
    this.line.draw();
    Gfx3Debug.drawGrid(Utils.MAT4_ROTATE_X(Math.PI * 0.5), 30, 1);
  }

  radToDegrees(rad) {
    let m = 2 * Math.PI;
    return (((rad % m) + m) % m) * (360 / m);
  }
}

module.exports.MainScreen = MainScreen;
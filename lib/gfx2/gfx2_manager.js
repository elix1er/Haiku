class Gfx2Manager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.cameraPosition = [0, 0];
    this.bgColor = [0, 0, 0, 1];

    this.canvas = document.getElementById('CANVAS_2D');
    if (!this.canvas) {
      throw new Error('Gfx2Manager::Gfx2Manager: CANVAS_2D not found');
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Gfx2Manager::Gfx2Manager: Your browser not support 2D');
    }
  }

  update(ts) {
    if (this.canvas.width != this.canvas.clientWidth || this.canvas.height != this.canvas.clientHeight) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
    }
  }

  beginDrawing() {
    this.ctx.restore();
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = `rgba(${this.bgColor[0]}, ${this.bgColor[1]}, ${this.bgColor[2]}, ${this.bgColor[3]})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.translate(-this.cameraPosition[0] + this.canvas.width * 0.5, -this.cameraPosition[1] + this.canvas.height * 0.5);
  }

  endDrawing() {}

  moveCamera(x, y) {
    this.cameraPosition[0] += x;
    this.cameraPosition[1] += y;
  }

  findCanvasFromClientPosition(clientX, clientY) {
    let rect = this.canvas.getBoundingClientRect();
    let x = clientX - rect.x;
    let y = clientY - rect.y;
    return [x, y];
  }

  findWorldFromClientPosition(clientX, clientY) {
    let rect = this.canvas.getBoundingClientRect();
    let x = (clientX - rect.x) + this.cameraPosition[0] - this.canvas.width * 0.5;
    let y = (clientY - rect.y) + this.cameraPosition[1] - this.canvas.height * 0.5;
    return [x, y];
  }

  getWidth() {
    return this.canvas.clientWidth;
  }

  getHeight() {
    return this.canvas.clientHeight;
  }

  getContext() {
    return this.ctx;
  }

  setCameraPosition(x, y) {
    this.cameraPosition[0] = x;
    this.cameraPosition[1] = y;
  }

  getCameraPosition() {
    return this.cameraPosition;
  }

  getCameraPositionX() {
    return this.cameraPosition[0];
  }

  getCameraPositionY() {
    return this.cameraPosition[1];
  }

  getBgColor() {
    return this.bgColor;
  }

  setBgColor(r, g, b, a) {
    this.bgColor = [r, g, b, a];
  }
}

module.exports.gfx2Manager = new Gfx2Manager();
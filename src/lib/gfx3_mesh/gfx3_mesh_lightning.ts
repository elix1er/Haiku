class Gfx3MeshLightning {
  position: vec4;

  constructor() {
    this.position = [0, 0, 0, 1.0];
  }

  getPosition(): vec4 {
    return this.position;
  }
}

export { Gfx3MeshLightning };
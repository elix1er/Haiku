class Gfx3MeshLightning {
  position: vec3;

  constructor() {
    this.position = [0, 0, 0];
  }

  getPosition(): vec3 {
    return this.position;
  }
}

export { Gfx3MeshLightning };
import { gfx3MeshRenderer } from './gfx3_mesh_renderer';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Material } from './gfx3_mesh_material';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_mesh_shader';

class Gfx3Mesh extends Gfx3Drawable {
  material: Gfx3Material;

  constructor() {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.material = new Gfx3Material({});
  }

  draw(): void {
    gfx3MeshRenderer.drawMesh(this);
  }

  setMaterial(material: Gfx3Material): void {
    this.material = material;
  }

  getMaterial(): Gfx3Material {
    return this.material;
  }
}

export { Gfx3Mesh };
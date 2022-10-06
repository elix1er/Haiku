import { gfx3MeshRenderer } from './gfx3_mesh_renderer';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Material } from './gfx3_mesh_material';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_mesh_shader';

class Gfx3Mesh extends Gfx3Drawable {
  material: Gfx3Material;

  constructor() {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.material = {
      ambiant: [0.2, 0.2, 0.2],
      specular: [1.0, 0.0, 0.0, 4],
      color: [1.0, 1.0, 1.0, 1.0],
      lightning: false,
      texture: null,
      normalMap: null,
      envMap: null
    };
  }

  draw(): void {
    gfx3MeshRenderer.drawMesh(this);
  }

  defineVertexNormal(x: number, y: number, z: number, uvx: number, uvy: number, nx: number, ny: number, nz: number): void {
    this.vertices.push(x, y, z, uvx, uvy, nx, ny, nz, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
  }

  defineVertexTangeant(x: number, y: number, z: number, uvx: number, uvy: number, nx: number, ny: number, nz: number, tx: number, ty: number, tz: number, bx: number, by: number, bz: number): void {
    this.vertices.push(x, y, z, uvx, uvy, nx, ny, nz, tx, ty, tz, bx, by, bz);
  }

  defineVertex(x: number, y: number, z: number, uvx: number, uvy: number): void {
    this.vertices.push(x, y, z, uvx, uvy, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
  }

  setMaterial(material: Partial<Gfx3Material> = {}): void {
    this.material.ambiant = material.ambiant ?? [0.2, 0.2, 0.2];
    this.material.specular = material.specular ?? [1.0, 0.0, 0.0, 4];
    this.material.color = material.color ?? [1.0, 1.0, 1.0, 1.0];
    this.material.lightning = material.lightning ?? false;
    this.material.texture = material.texture ?? null;
    this.material.normalMap = material.normalMap ?? null;
    this.material.envMap = material.envMap ?? null;
  }

  getMaterial(): Gfx3Material {
    return this.material;
  }
}

export { Gfx3Mesh };
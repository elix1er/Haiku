import { gfx3Manager } from '../gfx3/gfx3_manager';
import { gfx3SkyboxRenderer } from './gfx3_skybox_renderer';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';

class Gfx3Skybox extends Gfx3Drawable {
  cubemap: Gfx3Texture;
  size: number;

  constructor() {
    super(8);
    this.cubemap = gfx3Manager.createCubeMapFromBitmap();
    this.size = 2;

    this.beginVertices(12 * 3);

    this.vertices.push(-this.size, -this.size, -this.size, -1, -1, -1);
    this.vertices.push(-this.size, -this.size, this.size, -1, -1, 1);
    this.vertices.push(this.size, -this.size, this.size, 1, -1, 1);

    this.vertices.push(-this.size, -this.size, -this.size, -1, -1, -1);
    this.vertices.push(this.size, -this.size, this.size, 1, -1, 1);
    this.vertices.push(this.size, -this.size, -this.size, 1, -1, -1);

    this.vertices.push(this.size, -this.size, -this.size, 1, -1, -1);
    this.vertices.push(this.size, -this.size, this.size, 1, -1, 1);
    this.vertices.push(this.size, this.size, this.size, 1, 1, 1);

    this.vertices.push(this.size, -this.size, -this.size, 1, -1, -1);
    this.vertices.push(this.size, this.size, this.size, 1, 1, 1);
    this.vertices.push(this.size, this.size, -this.size, 1, 1, -1);

    this.vertices.push(this.size, this.size, -this.size, 1, 1, -1);
    this.vertices.push(this.size, this.size, this.size, 1, 1, 1);
    this.vertices.push(-this.size, this.size, this.size, -1, 1, 1);

    this.vertices.push(this.size, this.size, -this.size, 1, 1, -1,);
    this.vertices.push(-this.size, this.size, this.size, -1, 1, 1);
    this.vertices.push(-this.size, this.size, -this.size, -1, 1, -1);

    this.vertices.push(-this.size, this.size, -this.size, -1, 1, -1);
    this.vertices.push(-this.size, this.size, this.size, -1, 1, 1);
    this.vertices.push(-this.size, -this.size, this.size, -1, -1, 1);

    this.vertices.push(-this.size, this.size, -this.size, -1, 1, -1);
    this.vertices.push(-this.size, -this.size, this.size, -1, -1, 1);
    this.vertices.push(-this.size, -this.size, -this.size, -1, -1, -1);

    this.vertices.push(-this.size, -this.size, this.size, -1, -1, 1);
    this.vertices.push(-this.size, this.size, this.size, -1, 1, 1);
    this.vertices.push(this.size, this.size, this.size, 1, 1, 1);

    this.vertices.push(this.size, this.size, this.size, 1, 1, 1);
    this.vertices.push(this.size, -this.size, this.size, 1, -1, 1);
    this.vertices.push(-this.size, -this.size, this.size, -1, -1, 1);

    this.vertices.push(-this.size, this.size, -this.size, -1, 1, -1);
    this.vertices.push(-this.size, -this.size, -this.size, -1, -1, -1);
    this.vertices.push(this.size, -this.size, -this.size, 1, -1, -1);

    this.vertices.push(-this.size, this.size, -this.size, -1, 1, -1);
    this.vertices.push(this.size, -this.size, -this.size, 1, -1, -1);
    this.vertices.push(this.size, this.size, -this.size, 1, 1, -1);

    this.endVertices();
  }

  draw(): void {
    gfx3SkyboxRenderer.draw(this);
  }

  setCubemap(cubemap: Gfx3Texture): void {
    this.cubemap = cubemap;
  }

  getCubemap(): Gfx3Texture {
    return this.cubemap;
  }
}

export { Gfx3Skybox };
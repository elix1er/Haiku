import { gfx3Manager, UniformGroupBitmaps } from '../gfx3/gfx3_manager';
import { gfx3SkyboxRenderer } from './gfx3_skybox_renderer';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_skybox_shader';

class Gfx3Skybox extends Gfx3Drawable {
  cubemap: Gfx3Texture;
  cubemapBuffer: UniformGroupBitmaps;
  cubemapChanged: boolean;

  constructor() {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.cubemap = gfx3Manager.createCubeMapFromBitmap();
    this.cubemapBuffer = gfx3Manager.createUniformGroupBitmaps('SKYBOX_PIPELINE', 1);
    this.cubemapBuffer.addSamplerInput(0, this.cubemap.gpuSampler);
    this.cubemapBuffer.addTextureInput(1, this.cubemap.gpuTexture, { dimension: 'cube' });
    this.cubemapBuffer.allocate();
    this.cubemapChanged = false;

    this.beginVertices(6);

    this.defineVertex(-1, -1, -1, -1, -1, -1);
    this.defineVertex(+1, -1, -1, -1, -1, +1);
    this.defineVertex(-1, +1, -1, +1, -1, +1);

    this.defineVertex(-1, +1, -1, -1, -1, -1);
    this.defineVertex(+1, -1, -1, +1, -1, +1);
    this.defineVertex(+1, +1, -1, +1, -1, -1);

    this.endVertices();
  }

  draw(): void {
    gfx3SkyboxRenderer.draw(this);
  }

  setCubemap(cubemap: Gfx3Texture): void {
    this.cubemap = cubemap;
    this.cubemapChanged = true;
  }

  getCubemap(): Gfx3Texture {
    return this.cubemap;
  }

  getCubemapBuffer(): UniformGroupBitmaps {
    if (this.cubemapChanged) {
      this.cubemapBuffer.addSamplerInput(0, this.cubemap.gpuSampler);
      this.cubemapBuffer.addTextureInput(1, this.cubemap.gpuTexture, { dimension: 'cube' });
      this.cubemapBuffer.allocate();
      this.cubemapChanged = false;
    }

    return this.cubemapBuffer;
  }
}

export { Gfx3Skybox };
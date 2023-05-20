import { gfx3Manager, UniformGroup } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { Gfx3Sprite } from './gfx3_sprite';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER } from './gfx3_sprite_shader';

class Gfx3SpriteRenderer {
  pipeline: GPURenderPipeline;
  defaultTexture: Gfx3Texture;
  uniformBuffer: UniformGroup;
  sprites: Array<Gfx3Sprite>;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('SPRITE_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.defaultTexture = gfx3Manager.createTextureFromBitmap();
    this.uniformBuffer = gfx3Manager.createUniformGroup(this.pipeline.getBindGroupLayout(0));
    this.uniformBuffer.addDatasetInput(0, UT.MAT4_SIZE, 'MVPC_MATRIX');
    this.sprites = [];
  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    if (this.uniformBuffer.getSize() < this.sprites.length) {
      this.uniformBuffer.allocate(this.sprites.length);
    }

    const cameraMatrix = currentView.getCameraMatrix();
    const viewMatrix = currentView.getCameraViewMatrix();
    const pcMatrix = currentView.getProjectionClipMatrix();
    const vpcMatrix = currentView.getViewProjectionClipMatrix();
    const mvpcMatrix = UT.MAT4_CREATE();

    this.uniformBuffer.beginWrite();

    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites[i];
      if (sprite.getBillboardMode()) {
        const mvMatrix = UT.MAT4_MULTIPLY(viewMatrix, sprite.getTransformMatrix());
        UT.MAT4_MULTIPLY(mvMatrix, cameraMatrix, mvMatrix);
        UT.MAT4_MULTIPLY(mvMatrix, UT.MAT4_TRANSLATE(viewMatrix[12], viewMatrix[13], viewMatrix[14]), mvMatrix);
        UT.MAT4_MULTIPLY(pcMatrix, mvMatrix, mvpcMatrix);
      }
      else {
        UT.MAT4_MULTIPLY(vpcMatrix, sprite.getTransformMatrix(), mvpcMatrix);
      }

      this.uniformBuffer.write(0, mvpcMatrix);
      passEncoder.setBindGroup(0, this.uniformBuffer.getBindGroup(i));

      const texture = sprite.getTexture();
      passEncoder.setBindGroup(1, texture.bindGroup);

      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), sprite.getVertexSubBufferOffset(), sprite.getVertexSubBufferSize());
      passEncoder.draw(sprite.getVertexCount());
    }

    this.uniformBuffer.endWrite();
    this.sprites = [];
  }

  drawSprite(sprite: Gfx3Sprite): void {
    this.sprites.push(sprite);
  }

  createTextureBinding(sampler: GPUSampler, texture: GPUTexture, createViewDescriptor: GPUTextureViewDescriptor = {}): GPUBindGroup {
    const device = gfx3Manager.getDevice();
    return device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: sampler
      }, {
        binding: 1,
        resource: texture.createView(createViewDescriptor)
      }]
    });
  }
}

export { Gfx3SpriteRenderer };
export const gfx3SpriteRenderer = new Gfx3SpriteRenderer();
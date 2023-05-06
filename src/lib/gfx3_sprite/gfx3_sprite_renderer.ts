import { gfx3Manager, UniformGroup, MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT } from '../gfx3/gfx3_manager';
import { Utils } from '../core/utils';
import { Gfx3Sprite } from './gfx3_sprite';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER, SHADER_UNIFORM_ATTR_COUNT } from './gfx3_sprite_shader';

class Gfx3SpriteRenderer {
  pipeline: GPURenderPipeline;
  uniformGroup: UniformGroup;
  sprites: Array<Gfx3Sprite>;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('SPRITE_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.uniformGroup = gfx3Manager.createUniformGroup(16 * 4);
    this.sprites = [];
  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    gfx3Manager.destroyUniformGroup(this.uniformGroup);
    this.uniformGroup = gfx3Manager.createUniformGroup(this.sprites.length * SHADER_UNIFORM_ATTR_COUNT * MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT);

    for (const sprite of this.sprites) {
      if (sprite.getBillboardMode()) {
        const viewMatrix = currentView.getCameraViewMatrix();
        let mvMatrix = Utils.MAT4_MULTIPLY(viewMatrix, sprite.getTransformMatrix());
        mvMatrix = Utils.MAT4_MULTIPLY(mvMatrix, currentView.getCameraMatrix());
        mvMatrix = Utils.MAT4_MULTIPLY(mvMatrix, Utils.MAT4_TRANSLATE(viewMatrix[12], viewMatrix[13], viewMatrix[14]));
        const mvpcMatrix = Utils.MAT4_MULTIPLY(gfx3Manager.getCurrentProjectionMatrix(), mvMatrix);
        gfx3Manager.writeUniformGroup(this.uniformGroup, 0, new Float32Array(mvpcMatrix));
      }
      else {
        const mvpcMatrix = Utils.MAT4_MULTIPLY(gfx3Manager.getCurrentViewProjectionMatrix(), sprite.getTransformMatrix());
        gfx3Manager.writeUniformGroup(this.uniformGroup, 0, new Float32Array(mvpcMatrix));
      }

      const texture = sprite.getTexture();
      const textureBinding = gfx3Manager.createTextureBinding(this.pipeline, texture.gpuSampler, texture.gpuTexture, 1);

      passEncoder.setBindGroup(0, gfx3Manager.createBindGroup({ layout: this.pipeline.getBindGroupLayout(0), entries: this.uniformGroup.entries }));
      passEncoder.setBindGroup(1, gfx3Manager.createBindGroup(textureBinding));
      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), sprite.getVertexSubBufferOffset(), sprite.getVertexSubBufferSize());
      passEncoder.draw(sprite.getVertexCount());
    }

    this.sprites = [];
  }

  drawSprite(sprite: Gfx3Sprite): void {
    this.sprites.push(sprite);
  }
}

export { Gfx3SpriteRenderer };
export const gfx3SpriteRenderer = new Gfx3SpriteRenderer();
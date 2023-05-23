import { gfx3Manager, UniformGroupDataset } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3RendererAbstract } from '../gfx3/gfx3_renderer_abstract';
import { Gfx3Sprite } from './gfx3_sprite';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER } from './gfx3_sprite_shader';

class Gfx3SpriteRenderer extends Gfx3RendererAbstract {
  spritesBuffer: UniformGroupDataset;
  sprites: Array<Gfx3Sprite>;

  constructor() {
    super('SPRITE_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.spritesBuffer = gfx3Manager.createUniformGroupDataset('SPRITE_PIPELINE', 0);
    this.spritesBuffer.addInput(0, UT.MAT4_SIZE, 'MVPC_MATRIX');
    this.spritesBuffer.allocate();
    this.sprites = [];
  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    if (this.spritesBuffer.getSize() < this.sprites.length) {
      this.spritesBuffer.allocate(this.sprites.length);
    }

    const cameraMatrix = currentView.getCameraMatrix();
    const viewMatrix = currentView.getCameraViewMatrix();
    const pcMatrix = currentView.getProjectionClipMatrix();
    const vpcMatrix = currentView.getViewProjectionClipMatrix();
    const mvpcMatrix = UT.MAT4_CREATE();

    this.spritesBuffer.beginWrite();

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

      this.spritesBuffer.write(0, mvpcMatrix);
      passEncoder.setBindGroup(0, this.spritesBuffer.getBindGroup(i));

      const textureBuffer = sprite.getTextureBuffer();
      passEncoder.setBindGroup(1, textureBuffer.getBindGroup());

      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), sprite.getVertexSubBufferOffset(), sprite.getVertexSubBufferSize());
      passEncoder.draw(sprite.getVertexCount());
    }

    this.spritesBuffer.endWrite();
    this.sprites = [];
  }

  drawSprite(sprite: Gfx3Sprite): void {
    this.sprites.push(sprite);
  }
}

export { Gfx3SpriteRenderer };
export const gfx3SpriteRenderer = new Gfx3SpriteRenderer();
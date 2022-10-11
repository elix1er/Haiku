import { gfx3Manager, UniformGroup, MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT } from '../gfx3/gfx3_manager';
import { Utils } from '../core/utils';
import { Gfx3Skybox } from './gfx3_skybox';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER, SHADER_UNIFORM_ATTR_COUNT } from './gfx3_skybox_shader';

class Gfx3SkyboxRenderer {
  pipeline: GPURenderPipeline;
  uniformGroup: UniformGroup;
  skybox: Gfx3Skybox | null;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('SKYBOX_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.uniformGroup = gfx3Manager.createUniformGroup(16 * 4);
    this.skybox = null;
  }

  render(): void {
    if (!this.skybox) {
      return;
    }

    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    gfx3Manager.destroyUniformGroup(this.uniformGroup);
    this.uniformGroup = gfx3Manager.createUniformGroup(SHADER_UNIFORM_ATTR_COUNT * MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT);

    const viewMatrix = gfx3Manager.getCurrentViewMatrix();
    viewMatrix[12] = 0;
    viewMatrix[13] = 0;
    viewMatrix[14] = 0;
    const vpcMatrix = Utils.MAT4_MULTIPLY(gfx3Manager.getCurrentProjectionMatrix(), viewMatrix);
    gfx3Manager.writeUniformGroup(this.uniformGroup, 0, new Float32Array(Utils.MAT4_INVERT(vpcMatrix)));

    const cubemap = this.skybox.getCubemap();
    const cubemapBinding = gfx3Manager.createTextureBinding(this.pipeline, cubemap.gpuSampler, cubemap.gpuTexture, 1, { dimension: 'cube' });

    passEncoder.setBindGroup(0, gfx3Manager.createBindGroup({ layout: this.pipeline.getBindGroupLayout(0), entries: this.uniformGroup.entries }));
    passEncoder.setBindGroup(1, gfx3Manager.createBindGroup(cubemapBinding));
    passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), this.skybox.getVertexSubBufferOffset(), this.skybox.getVertexSubBufferSize());
    passEncoder.draw(this.skybox.getVertexCount());
  }

  draw(skybox: Gfx3Skybox): void {
    this.skybox = skybox;
  }
}

export { Gfx3SkyboxRenderer };
export const gfx3SkyboxRenderer = new Gfx3SkyboxRenderer();
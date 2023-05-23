import { gfx3Manager, UniformGroupDataset } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Skybox } from './gfx3_skybox';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER } from './gfx3_skybox_shader';

class Gfx3SkyboxRenderer {
  pipeline: GPURenderPipeline;
  dataBuffer: UniformGroupDataset;
  skybox: Gfx3Skybox | null;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('SKYBOX_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.dataBuffer = gfx3Manager.createUniformGroupDataset('SKYBOX_PIPELINE', 0);
    this.dataBuffer.addInput(0, UT.MAT4_SIZE, 'VPC_INVERSE_MATRIX');
    this.dataBuffer.allocate();
    this.skybox = null;
  }

  render(): void {
    if (!this.skybox) {
      return;
    }

    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    const viewMatrix = new Float32Array(currentView.getCameraViewMatrix());
    viewMatrix[12] = viewMatrix[13] = viewMatrix[14] = 0;

    const vpcMatrix = UT.MAT4_MULTIPLY(currentView.getProjectionClipMatrix(), viewMatrix);
    const vpcInverseMatrix = UT.MAT4_CREATE();
    UT.MAT4_INVERT(vpcMatrix, vpcInverseMatrix);

    this.dataBuffer.beginWrite();
    this.dataBuffer.write(0, vpcInverseMatrix);
    this.dataBuffer.endWrite();
    passEncoder.setBindGroup(0, this.dataBuffer.getBindGroup());

    const cubemapBuffer = this.skybox.getCubemapBuffer();
    passEncoder.setBindGroup(1, cubemapBuffer.getBindGroup());

    passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), this.skybox.getVertexSubBufferOffset(), this.skybox.getVertexSubBufferSize());
    passEncoder.draw(this.skybox.getVertexCount());
  }

  draw(skybox: Gfx3Skybox): void {
    this.skybox = skybox;
  }
}

export { Gfx3SkyboxRenderer };
export const gfx3SkyboxRenderer = new Gfx3SkyboxRenderer();
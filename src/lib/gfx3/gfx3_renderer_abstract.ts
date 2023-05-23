import { gfx3Manager } from '../gfx3/gfx3_manager';

class Gfx3RendererAbstract {
  pipeline: GPURenderPipeline;

  constructor(pipelineName: string, vertexShader: string, fragmentShader: string, pipelineDesc: GPURenderPipelineDescriptor) {
    this.pipeline = gfx3Manager.loadPipeline(pipelineName, vertexShader, fragmentShader, pipelineDesc);
  }
}

export { Gfx3RendererAbstract };
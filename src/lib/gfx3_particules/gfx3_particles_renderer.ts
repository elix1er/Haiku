import { gfx3Manager, UniformGroupDataset } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Particles } from './gfx3_particles';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER } from './gfx3_particles_shader';

class Gfx3ParticlesRenderer {
  pipeline: GPURenderPipeline;
  particlesBuffer: UniformGroupDataset;
  particlesList: Array<Gfx3Particles>;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('PARTICLES_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.particlesBuffer = gfx3Manager.createUniformGroupDataset('PARTICLES_PIPELINE', 0);
    this.particlesBuffer.addInput(0, UT.F16_SIZE, 'VC_MATRIX');
    this.particlesBuffer.addInput(1, UT.F16_SIZE, 'MVPC_MATRIX');
    this.particlesBuffer.allocate();
    this.particlesList = [];
  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    if (this.particlesBuffer.getSize() < this.particlesList.length) {
      this.particlesBuffer.allocate(this.particlesList.length);
    }

    const vMatrix = currentView.getCameraViewMatrix();
    const vpcMatrix = currentView.getViewProjectionClipMatrix();    
    const mvpcMatrix = UT.MAT4_CREATE();

    this.particlesBuffer.beginWrite();

    for (let i = 0; i < this.particlesList.length; i++) {
      const particles = this.particlesList[i];

      const mMatrix = particles.getTransformMatrix();
      UT.MAT4_MULTIPLY(vpcMatrix, mMatrix, mvpcMatrix);

      this.particlesBuffer.write(0, vMatrix);
      this.particlesBuffer.write(1, mvpcMatrix);
      passEncoder.setBindGroup(0, this.particlesBuffer.getBindGroup(i));

      const textureBuffer = particles.getTextureBuffer();
      passEncoder.setBindGroup(1, textureBuffer.getBindGroup());

      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), particles.getVertexSubBufferOffset(), particles.getVertexSubBufferSize());
      passEncoder.draw(particles.getVertexCount());
    }

    this.particlesBuffer.endWrite();    
    this.particlesList = [];
  }

  drawParticles(particles: Gfx3Particles): void {
    this.particlesList.push(particles);
  }
}

export { Gfx3ParticlesRenderer };
export const gfx3ParticlesRenderer = new Gfx3ParticlesRenderer();
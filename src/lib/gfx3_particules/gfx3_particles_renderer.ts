import { gfx3Manager, UniformGroup, MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { Gfx3Particles } from './gfx3_particles';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER, SHADER_UNIFORM_ATTR_COUNT } from './gfx3_particles_shader';

class Gfx3ParticlesRenderer {
  pipeline: GPURenderPipeline;
  uniformGroup: UniformGroup;
  particlesList: Array<Gfx3Particles>;
  defaultTexture:Gfx3Texture;
  pointLight0Color:vec4;
  pointLight0: vec4;

  pointLight1Color:vec4;
  pointLight1: vec4;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('PARTICULES_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.particlesList = [];

    this.defaultTexture = gfx3Manager.createTextureFromBitmap();
    this.pointLight0 = UT.VEC4_CREATE(0, 0, 0, 1);
    this.pointLight0Color = UT.VEC4_CREATE(1, 1, 1, 10);

    this.pointLight1 = UT.VEC4_CREATE(0, 0, 0, 1);
    this.pointLight1Color = UT.VEC4_CREATE(1, 1, 1, 10);

    this.uniformGroup = gfx3Manager.createUniformGroup(this.pipeline.getBindGroupLayout(0));
    this.uniformGroup.addDatasetInput(0, UT.MAT4_SIZE, 'MODEL_MAT');
    this.uniformGroup.addDatasetInput(1, UT.MAT4_SIZE, 'VIEW_MAT');
    this.uniformGroup.addDatasetInput(2, UT.VEC4_SIZE, 'INFOS');
    this.uniformGroup.addDatasetInput(3, UT.VEC4_SIZE, 'POINT_LIGHT0');
    this.uniformGroup.addDatasetInput(4, UT.VEC4_SIZE, 'POINT_LIGHT0_COLOR');
    this.uniformGroup.addDatasetInput(5, UT.VEC4_SIZE, 'POINT_LIGHT1');
    this.uniformGroup.addDatasetInput(6, UT.VEC4_SIZE, 'POINT_LIGHT1_COLOR');
    this.uniformGroup.addSamplerInput(7, this.defaultTexture.gpuSampler);
    this.uniformGroup.addTextureInput(8, this.defaultTexture.gpuTexture);
    this.uniformGroup.allocate(1);

  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    if(this.particlesList.length<=0){
      return;
    }


    this.uniformGroup = gfx3Manager.createUniformGroup(this.pipeline.getBindGroupLayout(0));
    this.uniformGroup.addDatasetInput(0, UT.MAT4_SIZE, 'MODEL_MAT');
    this.uniformGroup.addDatasetInput(1, UT.MAT4_SIZE, 'VIEW_MAT');
    this.uniformGroup.addDatasetInput(2, UT.VEC4_SIZE, 'INFOS');
    this.uniformGroup.addDatasetInput(3, UT.VEC4_SIZE, 'POINT_LIGHT0');
    this.uniformGroup.addDatasetInput(4, UT.VEC4_SIZE, 'POINT_LIGHT0_COLOR');
    this.uniformGroup.addDatasetInput(5, UT.VEC4_SIZE, 'POINT_LIGHT1');
    this.uniformGroup.addDatasetInput(6, UT.VEC4_SIZE, 'POINT_LIGHT1_COLOR');
    if(this.particlesList[0].texture)
    {
      this.uniformGroup.addSamplerInput(7, this.particlesList[0].texture.gpuSampler);
      this.uniformGroup.addTextureInput(8, this.particlesList[0].texture.gpuTexture);
    }
    this.uniformGroup.allocate(1);

    /*
    if (this.uniformGroup.getSize() < this.particlesList.length) {
      this.uniformGroup.allocate(this.particlesList.length);
    }
    */

    const cmvp = currentView.getViewProjectionClipMatrix();

    //for (let n=0;n<this.particlesList.length;n++) 
    {

      const particles = this.particlesList[0];

      this.uniformGroup.beginWrite();
      this.uniformGroup.write(0, new Float32Array(particles.getTransformMatrix()));
      this.uniformGroup.write(1, new Float32Array(cmvp));
      this.uniformGroup.write(2, UT.VEC4_CREATE(particles.texture?1:0,0,0,0));
      this.uniformGroup.write(3, new Float32Array(this.pointLight0));
      this.uniformGroup.write(4, new Float32Array(this.pointLight0Color));
      this.uniformGroup.write(5, new Float32Array(this.pointLight1));
      this.uniformGroup.write(6, new Float32Array(this.pointLight1Color));
      this.uniformGroup.endWrite();

      /*
      this.uniformGroup.setSamplerEntry(n, 7, particles.texture ? particles.texture.gpuSampler : this.defaultTexture.gpuSampler);
      this.uniformGroup.setTextureEntry(n, 8, particles.texture ? particles.texture.gpuTexture : this.defaultTexture.gpuTexture);
      */

      passEncoder.setBindGroup(0, this.uniformGroup.getBindGroup(0));

      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), particles.getVertexSubBufferOffset(), particles.getVertexSubBufferSize());
      passEncoder.draw(particles.getVertexCount());
    }

    this.particlesList = [];
  }

  drawParticles(particles: Gfx3Particles): void {
    this.particlesList.push(particles);
  }
}

export { Gfx3ParticlesRenderer };
export const gfx3ParticlesRenderer = new Gfx3ParticlesRenderer();
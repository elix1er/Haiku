import { gfx3Manager, UniformGroup } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Mesh } from './gfx3_mesh';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER } from './gfx3_mesh_shader';

interface MeshCommand {
  mesh: Gfx3Mesh;
  matrix: mat4_buf | null;
};

class Gfx3MeshRenderer {
  pipeline: GPURenderPipeline;
  defaultTexture: Gfx3Texture;
  defaultEnvMap: Gfx3Texture;
  materialBuffers: Array<UniformGroup>;
  worldBuffer: UniformGroup;
  meshBuffer: UniformGroup;
  pointLight0: vec4_buf;
  pointLight0Color: vec4_buf;
  pointLight1: vec4_buf;
  pointLight1Color: vec4_buf;
  dirLight: vec4_buf;
  dirLightColor: vec3_buf;
  meshCommands: Array<MeshCommand>;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('MESH_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.defaultTexture = gfx3Manager.createTextureFromBitmap();
    this.defaultEnvMap = gfx3Manager.createCubeMapFromBitmap();

    this.materialBuffers = [];
    this.worldBuffer = gfx3Manager.createUniformGroup(this.pipeline.getBindGroupLayout(0));
    this.worldBuffer.addDatasetInput(0, UT.VEC3_SIZE, 'CAM_POS');
    this.worldBuffer.addDatasetInput(1, UT.VEC4_SIZE, 'POINT_LIGHT0');
    this.worldBuffer.addDatasetInput(2, UT.VEC4_SIZE, 'POINT_LIGHT0_COLOR');
    this.worldBuffer.addDatasetInput(3, UT.VEC4_SIZE, 'POINT_LIGHT1');
    this.worldBuffer.addDatasetInput(4, UT.VEC4_SIZE, 'POINT_LIGHT1_COLOR');
    this.worldBuffer.addDatasetInput(5, UT.VEC4_SIZE, 'DIR_LIGHT');
    this.worldBuffer.addDatasetInput(6, UT.VEC4_SIZE, 'DIR_LIGHT_COLOR');
    this.worldBuffer.allocate(1);

    this.meshBuffer = gfx3Manager.createUniformGroup(this.pipeline.getBindGroupLayout(1));
    this.meshBuffer.addDatasetInput(0, UT.MAT4_SIZE, 'MVPC_MATRIX');
    this.meshBuffer.addDatasetInput(1, UT.MAT4_SIZE, 'NORM_MATRIX');
    this.meshBuffer.addDatasetInput(2, UT.MAT4_SIZE, 'M_MATRIX');
    this.meshBuffer.allocate(1);

    this.pointLight0 = UT.VEC4_CREATE();
    this.pointLight0Color = UT.VEC4_CREATE();
    this.pointLight1 = UT.VEC4_CREATE();
    this.pointLight1Color = UT.VEC4_CREATE();
    this.dirLight = UT.VEC4_CREATE();
    this.dirLightColor = UT.VEC3_CREATE();

    this.meshCommands = [];
  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    this.worldBuffer.beginWrite();
    this.worldBuffer.write(0, new Float32Array(currentView.getCameraPosition()));
    this.worldBuffer.write(1, this.pointLight0);
    this.worldBuffer.write(2, this.pointLight0Color);
    this.worldBuffer.write(3, this.pointLight1);
    this.worldBuffer.write(4, this.pointLight1Color);
    this.worldBuffer.write(5, this.dirLight);
    this.worldBuffer.write(6, this.dirLightColor);
    this.worldBuffer.endWrite();
    passEncoder.setBindGroup(0, this.worldBuffer.getBindGroup(0));

    const vpcMatrix = currentView.getViewProjectionClipMatrix();
    const mvpcMatrix = UT.MAT4_CREATE();
    const normMatrix = UT.MAT4_CREATE();

    if (this.meshBuffer.getSize() < this.meshCommands.length) {
      this.meshBuffer.allocate(this.meshCommands.length);
    }

    this.meshBuffer.beginWrite();

    for (let i = 0; i < this.meshCommands.length; i++) {
      const command = this.meshCommands[i];
      const mMatrix = command.matrix ? command.matrix : command.mesh.getTransformMatrix();
      normMatrix[0] = mMatrix[0]; normMatrix[1] = mMatrix[1]; normMatrix[2] = mMatrix[2];
      normMatrix[4] = mMatrix[4]; normMatrix[5] = mMatrix[5]; normMatrix[6] = mMatrix[6];
      normMatrix[8] = mMatrix[8]; normMatrix[9] = mMatrix[9]; normMatrix[10] = mMatrix[10];
      UT.MAT4_MULTIPLY(vpcMatrix, mMatrix, mvpcMatrix);

      this.meshBuffer.write(0, mvpcMatrix);
      this.meshBuffer.write(1, normMatrix);
      this.meshBuffer.write(2, mMatrix);
      passEncoder.setBindGroup(1, this.meshBuffer.getBindGroup(i));

      const material = command.mesh.getMaterial();
      const materialBuffer = material.getBuffer();

      if(material.changed)
        material.draw();

      passEncoder.setBindGroup(2, materialBuffer.getBindGroup(0));

      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), command.mesh.getVertexSubBufferOffset(), command.mesh.getVertexSubBufferSize());
      passEncoder.draw(command.mesh.getVertexCount());
    }

    this.meshBuffer.endWrite();

    this.meshCommands = [];
    this.pointLight0[3] = 0;
    this.pointLight1[3] = 0;
    this.dirLight[3] = 0;
  }

  createMaterialBuffer(): UniformGroup {
    const buffer = gfx3Manager.createUniformGroup(this.pipeline.getBindGroupLayout(2));
    buffer.addDatasetInput(0, UT.VEC4_SIZE, 'MAT_AMBIANT_COLOR');
    buffer.addDatasetInput(1, UT.VEC4_SIZE, 'MAT_DIFFUSE_COLOR');
    buffer.addDatasetInput(2, UT.VEC4_SIZE, 'MAT_SPECULAR');
    buffer.addDatasetInput(3, UT.VEC5_SIZE, 'MAT_PARAMS');
    buffer.addSamplerInput(4, this.defaultTexture.gpuSampler);
    buffer.addTextureInput(5, this.defaultTexture.gpuTexture);
    buffer.addSamplerInput(6, this.defaultTexture.gpuSampler);
    buffer.addTextureInput(7, this.defaultTexture.gpuTexture);
    buffer.addSamplerInput(8, this.defaultEnvMap.gpuSampler);
    buffer.addTextureInput(9, this.defaultEnvMap.gpuTexture, { dimension: 'cube' });
    buffer.addSamplerInput(10, this.defaultTexture.gpuSampler);
    buffer.addTextureInput(11, this.defaultTexture.gpuTexture);
    buffer.allocate(1);

    this.materialBuffers.push(buffer);
    return buffer;
  }

  destroyMaterialBuffer(buffer: UniformGroup): void {
    buffer.destroy();
    const index = this.materialBuffers.indexOf(buffer);
    this.materialBuffers.splice(index, 1);
  }

  drawMesh(mesh: Gfx3Mesh, matrix: mat4_buf | null = null): void {
    this.meshCommands.push({ mesh: mesh, matrix: matrix });
  }

  enablePointLight(position: vec3, index: number): void {
    if (index == 0) {
      this.pointLight0[0] = position[0];
      this.pointLight0[1] = position[1];
      this.pointLight0[2] = position[2];
      this.pointLight0[3] = 1;
    }
    else if (index == 1) {
      this.pointLight1[0] = position[0];
      this.pointLight1[1] = position[1];
      this.pointLight1[2] = position[2];
      this.pointLight1[3] = 1;
    }
  }

  enableDirLight(direction: vec3): void {
    this.dirLight[0] = direction[0];
    this.dirLight[1] = direction[1];
    this.dirLight[2] = direction[2];
    this.dirLight[0] = 1;
  }

  getDefaultTexture(): Gfx3Texture {
    return this.defaultTexture;
  }

  getDefaultEnvMap(): Gfx3Texture {
    return this.defaultEnvMap;
  }
}

export { Gfx3MeshRenderer };
export const gfx3MeshRenderer = new Gfx3MeshRenderer();
import { gfx3Manager, UniformGroupDataset } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3RendererAbstract } from '../gfx3/gfx3_renderer_abstract';
import { Gfx3Mesh } from './gfx3_mesh';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER } from './gfx3_mesh_shader';

interface MeshCommand {
  mesh: Gfx3Mesh;
  matrix: mat4_buf | null;
};

class Gfx3MeshRenderer extends Gfx3RendererAbstract {
  worldBuffer: UniformGroupDataset;
  cmdBuffer: UniformGroupDataset;
  pointLight0: vec10_buf;
  pointLight1: vec10_buf;
  dirLight: vec7_buf;
  meshCommands: Array<MeshCommand>;

  constructor() {
    super('MESH_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.worldBuffer = gfx3Manager.createUniformGroupDataset('MESH_PIPELINE', 0);
    this.worldBuffer.addInput(0, UT.F03_SIZE, 'CAM_POS');
    this.worldBuffer.addInput(1, UT.F16_SIZE, 'POINT_LIGHT0');
    this.worldBuffer.addInput(2, UT.F16_SIZE, 'POINT_LIGHT1');
    this.worldBuffer.addInput(3, UT.F12_SIZE, 'DIR_LIGHT');
    this.worldBuffer.allocate();

    this.cmdBuffer = gfx3Manager.createUniformGroupDataset('MESH_PIPELINE', 1);
    this.cmdBuffer.addInput(0, UT.F16_SIZE * 3, 'MESH_MATRICES');
    this.cmdBuffer.allocate();

    this.pointLight0 = new Float32Array(16);
    this.enablePointLight(0, [1, 1, 1], 0);
    
    this.pointLight1 = new Float32Array(16);
    this.enablePointLight(1, [1, 1, 1], 0);

    this.dirLight = new Float32Array(12);
    this.enableDirLight([1, 1, 1], 0);

    this.meshCommands = [];
  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    this.worldBuffer.beginWrite();
    this.worldBuffer.write(0, new Float32Array(currentView.getCameraPosition()));
    this.worldBuffer.write(1, this.pointLight0);
    this.worldBuffer.write(2, this.pointLight1);
    this.worldBuffer.write(3, this.dirLight);
    this.worldBuffer.endWrite();
    passEncoder.setBindGroup(0, this.worldBuffer.getBindGroup());

    if (this.cmdBuffer.getSize() < this.meshCommands.length) {
      this.cmdBuffer.allocate(this.meshCommands.length);
    }

    const vpcMatrix = currentView.getViewProjectionClipMatrix();
    const matricesData = new Float32Array(16 * 3);

    this.cmdBuffer.beginWrite();

    for (let i = 0; i < this.meshCommands.length; i++) {
      const command = this.meshCommands[i];
      const mMatrix = command.matrix ? command.matrix : command.mesh.getTransformMatrix();

      // mvpc-matrix
      UT.MAT4_MULTIPLY(vpcMatrix, mMatrix, matricesData);
      // model-matrix
      matricesData[16 + 0] = mMatrix[0];
      matricesData[16 + 1] = mMatrix[1];
      matricesData[16 + 2] = mMatrix[2];
      matricesData[16 + 3] = mMatrix[3];
      matricesData[16 + 4] = mMatrix[4];
      matricesData[16 + 5] = mMatrix[5];
      matricesData[16 + 6] = mMatrix[6];
      matricesData[16 + 7] = mMatrix[7];
      matricesData[16 + 8] = mMatrix[8];
      matricesData[16 + 9] = mMatrix[9];
      matricesData[16 + 10] = mMatrix[10];
      matricesData[16 + 11] = mMatrix[11];
      matricesData[16 + 12] = mMatrix[12];
      matricesData[16 + 13] = mMatrix[13];
      matricesData[16 + 14] = mMatrix[14];
      matricesData[16 + 15] = mMatrix[15];
      // norm-matrix
      matricesData[32 + 0] = mMatrix[0];
      matricesData[32 + 1] = mMatrix[1];
      matricesData[32 + 2] = mMatrix[2];
      matricesData[32 + 4] = mMatrix[4];
      matricesData[32 + 5] = mMatrix[5];
      matricesData[32 + 6] = mMatrix[6];
      matricesData[32 + 8] = mMatrix[8];
      matricesData[32 + 9] = mMatrix[9];
      matricesData[32 + 10] = mMatrix[10];
      this.cmdBuffer.write(0, matricesData);
      passEncoder.setBindGroup(1, this.cmdBuffer.getBindGroup(i));

      const material = command.mesh.getMaterial();
      const materialData = material.getDataBuffer();
      passEncoder.setBindGroup(2, materialData.getBindGroup());
      const materialTextures = material.getTexturesBuffer();
      passEncoder.setBindGroup(3, materialTextures.getBindGroup());

      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), command.mesh.getVertexSubBufferOffset(), command.mesh.getVertexSubBufferSize());
      passEncoder.draw(command.mesh.getVertexCount());
    }

    this.cmdBuffer.endWrite();
    this.meshCommands = [];
  }

  drawMesh(mesh: Gfx3Mesh, matrix: mat4_buf | null = null): void {
    this.meshCommands.push({ mesh: mesh, matrix: matrix });
  }

  enablePointLight(index: number, position: vec3, intensity: number = 1): void {
    if (index == 0) {
      this.pointLight0[0] = intensity;
      this.pointLight0[1 * 4 + 0] = position[0];
      this.pointLight0[1 * 4 + 1] = position[1];
      this.pointLight0[1 * 4 + 2] = position[2];
    }
    else if (index == 1) {
      this.pointLight1[0] = intensity;
      this.pointLight1[1 * 4 + 0] = position[0];
      this.pointLight1[1 * 4 + 1] = position[1];
      this.pointLight1[1 * 4 + 2] = position[2];
    }
  }

  setPointLightColor(index: number, color: vec3): void {
    if (index == 0) {
      this.pointLight0[2 * 4 + 0] = color[0];
      this.pointLight0[2 * 4 + 1] = color[1];
      this.pointLight0[2 * 4 + 2] = color[2];
    }
    else if (index == 1) {
      this.pointLight1[2 * 4 + 0] = color[0];
      this.pointLight1[2 * 4 + 1] = color[1];
      this.pointLight1[2 * 4 + 2] = color[2];
    }
  }

  setPointLightAttenuation(index: number, constant: number, linear: number, exp: number): void {
    if (index == 0) {
      this.pointLight0[3 * 4 + 0] = constant;
      this.pointLight0[3 * 4 + 1] = linear;
      this.pointLight0[3 * 4 + 2] = exp;
    }
    else if (index == 1) {
      this.pointLight1[3 * 4 + 0] = constant;
      this.pointLight1[3 * 4 + 1] = linear;
      this.pointLight1[3 * 4 + 2] = exp;
    }
  }

  enableDirLight(direction: vec3, intensity: number = 1): void {
    this.dirLight[0] = intensity;
    this.dirLight[1 * 4 + 0] = direction[0];
    this.dirLight[1 * 4 + 1] = direction[1];
    this.dirLight[1 * 4 + 2] = direction[2];    
  }

  setDirLightColor(color: vec3): void {
    this.dirLight[2 * 4 + 0] = color[0];
    this.dirLight[2 * 4 + 1] = color[1];
    this.dirLight[2 * 4 + 2] = color[2];
  }
}

export { Gfx3MeshRenderer };
export const gfx3MeshRenderer = new Gfx3MeshRenderer();
import { gfx3Manager, UniformGroupDataset } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3RendererAbstract } from '../gfx3/gfx3_renderer_abstract';
import { Gfx3Mesh } from './gfx3_mesh';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER } from './gfx3_mesh_shader';

interface MeshCommand {
  mesh: Gfx3Mesh;
  matrix: mat4_buf | null;
};

class Gfx3MeshRenderer extends Gfx3RendererAbstract {
  defaultTexture: Gfx3Texture;
  defaultEnvMap: Gfx3Texture;
  worldBuffer: UniformGroupDataset;
  cmdBuffer: UniformGroupDataset;
  pointLight0: vec4_buf;
  pointLight0Color: vec4_buf;
  pointLight1: vec4_buf;
  pointLight1Color: vec4_buf;
  dirLight: vec4_buf;
  dirLightColor: vec3_buf;
  meshCommands: Array<MeshCommand>;

  constructor() {
    super('MESH_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.defaultTexture = gfx3Manager.createTextureFromBitmap();
    this.defaultEnvMap = gfx3Manager.createCubeMapFromBitmap();

    this.worldBuffer = gfx3Manager.createUniformGroupDataset('MESH_PIPELINE', 0);
    this.worldBuffer.addInput(0, UT.VEC3_SIZE, 'CAM_POS');
    this.worldBuffer.addInput(1, UT.VEC4_SIZE, 'POINT_LIGHT0');
    this.worldBuffer.addInput(2, UT.VEC4_SIZE, 'POINT_LIGHT0_COLOR');
    this.worldBuffer.addInput(3, UT.VEC4_SIZE, 'POINT_LIGHT1');
    this.worldBuffer.addInput(4, UT.VEC4_SIZE, 'POINT_LIGHT1_COLOR');
    this.worldBuffer.addInput(5, UT.VEC4_SIZE, 'DIR_LIGHT');
    this.worldBuffer.addInput(6, UT.VEC4_SIZE, 'DIR_LIGHT_COLOR');
    this.worldBuffer.allocate();

    this.cmdBuffer = gfx3Manager.createUniformGroupDataset('MESH_PIPELINE', 1);
    this.cmdBuffer.addInput(0, UT.MAT4_SIZE * 3, 'MESH_MATRICES');
    this.cmdBuffer.allocate();

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
    this.pointLight0[3] = 0;
    this.pointLight1[3] = 0;
    this.dirLight[3] = 0;
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

  setPointLightColor(index: number, r: number, g: number, b: number): void {
    if (index == 0) {
      this.pointLight0Color[0] = r;
      this.pointLight0Color[1] = g;
      this.pointLight0Color[2] = b;
    }
    else if (index == 1) {
      this.pointLight1Color[0] = r;
      this.pointLight1Color[1] = g;
      this.pointLight1Color[2] = b;
    }
  }

  enableDirLight(direction: vec3): void {
    this.dirLight[0] = direction[0];
    this.dirLight[1] = direction[1];
    this.dirLight[2] = direction[2];
    this.dirLight[3] = 1;
  }

  setDirLightColor(r: number, g: number, b: number): void {
    this.dirLightColor[0] = r;
    this.dirLightColor[1] = g;
    this.dirLightColor[2] = b;
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
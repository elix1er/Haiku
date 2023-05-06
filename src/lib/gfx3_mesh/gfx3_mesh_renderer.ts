import { gfx3Manager, UniformGroup, MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT } from '../gfx3/gfx3_manager';
import { Utils } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { Gfx3Mesh } from './gfx3_mesh';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER, SHADER_UNIFORM_ATTR_COUNT } from './gfx3_mesh_shader';

interface MeshCommand {
  mesh: Gfx3Mesh;
  matrix: mat4 | null;
};

class Gfx3MeshRenderer {
  pipeline: GPURenderPipeline;
  uniformGroup: UniformGroup;
  meshCommands: Array<MeshCommand>;

  defaultTexture: Gfx3Texture;
  defaultEnvMap: Gfx3Texture;

  pointLight0: vec4;
  pointLight1: vec4;
  dirLight: vec4;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('MESH_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.uniformGroup = gfx3Manager.createUniformGroup(16 * 4);
    this.defaultTexture = gfx3Manager.createTextureFromBitmap();
    this.defaultEnvMap = gfx3Manager.createCubeMapFromBitmap();
    this.meshCommands = [];
    this.pointLight0 = [0, 0, 0, 0];
    this.pointLight1 = [0, 0, 0, 0];
    this.dirLight = [0, 0, 0, 0];
  }

  render(): void {
    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    gfx3Manager.destroyUniformGroup(this.uniformGroup);
    this.uniformGroup = gfx3Manager.createUniformGroup(this.meshCommands.length * SHADER_UNIFORM_ATTR_COUNT * MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT);

    for (const command of this.meshCommands) {
      const mMatrix = command.matrix ? command.matrix : command.mesh.getTransformMatrix();
      const mvpcMatrix = Utils.MAT4_MULTIPLY(gfx3Manager.getCurrentViewProjectionMatrix(), mMatrix);
      const normMatrix = [
        mMatrix[0], mMatrix[1], mMatrix[2], 0,
        mMatrix[4], mMatrix[5], mMatrix[6], 0,
        mMatrix[8], mMatrix[9], mMatrix[10], 0,
        0, 0, 1
      ];

      const material = command.mesh.getMaterial();
      const materialParams = new Float32Array([
        material.opacity,
        material.texture ? 1 : 0,
        material.lightning ? 1 : 0,
        material.normalMap ? 1 : 0,
        material.envMap ? 1 : 0
      ]);

      gfx3Manager.writeUniformGroup(this.uniformGroup, 0, new Float32Array(mvpcMatrix));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 1, new Float32Array(normMatrix));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 2, new Float32Array(mMatrix));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 3, new Float32Array(currentView.getCameraPosition()));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 4, new Float32Array(this.pointLight0));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 5, new Float32Array(this.pointLight1));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 6, new Float32Array(this.dirLight));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 7, new Float32Array(material.ambiant));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 8, new Float32Array(material.diffuse));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 9, new Float32Array(material.specular));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 10, materialParams);

      const texture = material.texture ? material.texture : this.defaultTexture;
      const textureBinding = gfx3Manager.createTextureBinding(this.pipeline, texture.gpuSampler, texture.gpuTexture, 1);

      const normalMap = material.normalMap ? material.normalMap : this.defaultTexture;
      const normalMapBinding = gfx3Manager.createTextureBinding(this.pipeline, normalMap.gpuSampler, normalMap.gpuTexture, 2);

      const envMap = material.envMap ? material.envMap : this.defaultEnvMap;
      const envMapBinding = gfx3Manager.createTextureBinding(this.pipeline, envMap.gpuSampler, envMap.gpuTexture, 3, { dimension: 'cube' });

      passEncoder.setBindGroup(0, gfx3Manager.createBindGroup({ layout: this.pipeline.getBindGroupLayout(0), entries: this.uniformGroup.entries }));
      passEncoder.setBindGroup(1, gfx3Manager.createBindGroup(textureBinding));
      passEncoder.setBindGroup(2, gfx3Manager.createBindGroup(normalMapBinding));
      passEncoder.setBindGroup(3, gfx3Manager.createBindGroup(envMapBinding));
      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), command.mesh.getVertexSubBufferOffset(), command.mesh.getVertexSubBufferSize());
      passEncoder.draw(command.mesh.getVertexCount());
    }

    this.meshCommands = [];
    this.pointLight0 = [0, 0, 0, 0];
    this.pointLight1 = [0, 0, 0, 0];
    this.dirLight = [0, 0, 0, 0];
  }

  drawMesh(mesh: Gfx3Mesh, matrix: mat4 | null = null): void {
    this.meshCommands.push({ mesh: mesh, matrix: matrix });
  }

  enablePointLight(position: vec3, index: number): void {
    if (index == 0) {
      this.pointLight0 = [position[0], position[1], position[2], 1];
    }
    else if (index == 1) {
      this.pointLight1 = [position[0], position[1], position[2], 1];
    }
  }

  enableDirLight(direction: vec3): void {
    this.dirLight = [direction[0], direction[1], direction[2], 1];
  }
}

export { Gfx3MeshRenderer };
export const gfx3MeshRenderer = new Gfx3MeshRenderer();
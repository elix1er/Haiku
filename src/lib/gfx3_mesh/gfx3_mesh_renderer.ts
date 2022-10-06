import { gfx3Manager, UniformGroup, MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT } from '../gfx3/gfx3_manager';
import { Utils } from '../core/utils';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { Gfx3Mesh } from './gfx3_mesh';
import { Gfx3MeshLightning } from './gfx3_mesh_lightning';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER, SHADER_UNIFORM_ATTR_COUNT } from './gfx3_mesh_shader';

interface GfxMeshDesc{
  mesh: Gfx3Mesh;
  matrix : mat4 | null;

}

class Gfx3MeshRenderer {
  pipeline: GPURenderPipeline;
  uniformGroup: UniformGroup;
  defaultTexture: Gfx3Texture;
  defaultEnvMap: Gfx3Texture;
  meshes: Array<GfxMeshDesc>;
  lightning: Gfx3MeshLightning | null;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('MESH_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.uniformGroup = gfx3Manager.createUniformGroup(16 * 4);
    this.defaultTexture = gfx3Manager.createTextureFromBitmap();
    this.defaultEnvMap = gfx3Manager.createCubeMapFromBitmap();
    this.meshes = [];
    this.lightning = null;
  }

  render(): void {
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    gfx3Manager.destroyUniformGroup(this.uniformGroup);
    this.uniformGroup = gfx3Manager.createUniformGroup(this.meshes.length * SHADER_UNIFORM_ATTR_COUNT * MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT);

    for (const mesh of this.meshes) {

      let mat;
     
      if(mesh.matrix)
          mat= mesh.matrix;
      else
          mat= mesh.mesh.getTransformMatrix();

      const mvMatrix = Utils.MAT4_MULTIPLY(gfx3Manager.getCurrentViewMatrix(), mat);
      const pcMatrix = gfx3Manager.getCurrentProjectionMatrix();
      const normMatrix =((mvMatrix));
      const material = mesh.mesh.getMaterial();
      const params = [];
      params[0] = material.texture ? 1 : 0;
      params[1] = material.lightning ? 1 : 0;
      params[2] = material.normalMap ? 1 : 0;
      params[3] = material.envMap ? 1 : 0;

      if(this.lightning){
        gfx3Manager.writeUniformGroup(this.uniformGroup, 3, new Float32Array(Utils.MAT4_MULTIPLY_BY_VEC4(gfx3Manager.getCurrentViewMatrix(), this.lightning.getPosition() )));
      }
      

      gfx3Manager.writeUniformGroup(this.uniformGroup, 0, new Float32Array(mvMatrix));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 1, new Float32Array(pcMatrix));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 2, new Float32Array(normMatrix));
      //gfx3Manager.writeUniformGroup(this.uniformGroup, 3, new Float32Array(this.lightning ? Utils.MAT4_MULTIPLY_BY_VEC4(gfx3Manager.getCurrentViewMatrix(), this.lightning.getPosition() ): [0, 0, 0]));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 4, new Float32Array(material.ambiant));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 5, new Float32Array(material.color));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 6, new Float32Array(material.specular));
      gfx3Manager.writeUniformGroup(this.uniformGroup, 7, new Float32Array(params));

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
      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), mesh.mesh.getVertexSubBufferOffset(), mesh.mesh.getVertexSubBufferSize());
      passEncoder.draw(mesh.mesh.getVertexCount());
    }

    this.meshes = [];
    this.lightning = null;
  }

  drawMesh(mesh: Gfx3Mesh, matrix:mat4 | null = null): void {
    this.meshes.push({mesh:mesh, matrix : matrix});
  }

  enableLight(lightning: Gfx3MeshLightning): void {
    this.lightning = lightning;
  }
}

export { Gfx3MeshRenderer };
export const gfx3MeshRenderer = new Gfx3MeshRenderer();
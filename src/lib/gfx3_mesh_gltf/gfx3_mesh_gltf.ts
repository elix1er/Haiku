import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { Utils } from '../core/utils';
import { Gfx3Mesh } from '../gfx3_mesh/gfx3_mesh';
import { Gfx3Material } from '../gfx3_mesh/gfx3_mesh_material';
import { Gfx3MeshGLTFObject } from './gfx3_mesh_gltf_object';
import { Gfx3Texture } from '../gfx3/gfx3_texture';

const ACCESSOR_SIZES: { [key: string]: number } = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT3: 9,
  MAT4: 16
};

interface GLTFBuffer {
  uri: String;
  data: ArrayBuffer;
};

interface GLTFBufferView {
  buffer: number;
  byteOffset: number;
  byteStride: number | undefined;
};

interface GLTFAccessor {
  bufferView: number;
  byteOffset: number;
  type: string;
  count: number;
  componentType: number;
};

interface GLTFImage {
  uri: string;
};

interface GLTFTexture {
  index: number;
  source: number;
};

interface GLTFpbrMetallicRoughness {
  baseColorFactor: vec4 | undefined;
  baseColorTexture: GLTFTexture | undefined;
};

interface GLTFMaterial {
  pbrMetallicRoughness: GLTFpbrMetallicRoughness;
  normalTexture: GLTFTexture | undefined;
  material: Gfx3Material | null;
  name: string;
};

interface GLTFPrimitive {
  material: number;
  drawable: Gfx3Mesh | null;
  attributes: { POSITION: number, NORMAL: number, TEXCOORD_0: number, TANGENT: number };
  indices: number | undefined;
};

interface GLTFMesh {
  primitives: Array<GLTFPrimitive>;
  name: string;
};

interface GLTFNode {
  mesh: number;
  name: string;
  position: vec3;
  scale: vec3;
  rotation: vec4;
  children: Array<number>;
};

interface GLTFScene {
  nodes: Array<number>;
};

class GLTFRoot {
  scenes: Array<GLTFScene>;
  meshes: Array<GLTFMesh>;
  buffers: Array<GLTFBuffer>;
  materials: Array<GLTFMaterial>;
  textures: Array<GLTFTexture>;
  images: Array<GLTFImage>;
  accessors: Array<GLTFAccessor>;
  bufferViews: Array<GLTFBufferView>;
  nodes: Array<GLTFNode>;
  constructor() {
    this.scenes = [];
    this.meshes = [];
    this.buffers = [];
    this.materials = [];
    this.textures = [];
    this.images = [];
    this.accessors = [];
    this.bufferViews = [];
    this.nodes = [];
  }
}

class Gfx3MeshGLTF extends Gfx3MeshGLTFObject {
  nodesCounter: number;
  root: GLTFRoot;
  globalURL: string;

  constructor() {
    super(0);
    this.nodesCounter = 1;
    this.root = new GLTFRoot();
    this.globalURL = '';
  }

  async loadFromFile(url: string): Promise<void> {
    const response = await fetch(url);
    this.root = await response.json();
    this.globalURL = url;
    this.name = 'GLTF ' + url;

    for (const mesh of this.root.meshes) {
      for (const primitive of mesh.primitives) {
        primitive.drawable = null;
      }
    }

    await this.loadBuffer(this.root.buffers[0]);
    await this.processScene(0, this);
  }

  async loadBuffer(buffer: GLTFBuffer): Promise<void> {
    const mypath = DIRNAME(this.globalURL) + '/' + buffer.uri;
    const bufferResponse = await fetch(mypath);
    buffer.data = await bufferResponse.arrayBuffer();
  }

  async processScene(idx: number, parent: Gfx3MeshGLTFObject) {
    const nodes = this.root.scenes[idx].nodes;
    for (const idx of nodes) {
      await this.processNode(idx, parent);
    }
  }

  async processNode(idx: number, parent: Gfx3MeshGLTFObject): Promise<void> {
    const node = this.root.nodes[idx];
    const object = new Gfx3MeshGLTFObject(this.nodesCounter++);
    object.setName(node.name);

    if (node.rotation) {
      const angles = Utils.QUAT_TO_EULER([node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]], 'YXZ');
      object.setRotation(angles[0], angles[1], angles[2]);
    }

    if (node.position) {
      object.setPosition(node.position[0], node.position[1], node.position[2]);
    }

    if (node.scale) {
      object.setScale(node.scale[0], node.scale[0], node.scale[0]);
    }

    if (node.mesh !== undefined) {
      this.processMesh(node.mesh, object);
    }

    parent.addChild(object);

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        await this.processNode(node.children[i], object);
      }
    }
  }

  async processMesh(idx: number, object: Gfx3MeshGLTFObject) {
    const mesh = this.root.meshes[idx];
    for (const primitive of mesh.primitives) {
      await this.processPrimitive(primitive, object);
    }
  }

  async processPrimitive(primitive: GLTFPrimitive, object: Gfx3MeshGLTFObject) {
    if (primitive.drawable) {
      object.addDrawable(primitive.drawable);
      return;
    }

    const vertices = this.getAccessorData(primitive.attributes['POSITION']);
    const indices = primitive.indices !== undefined ? this.getAccessorData(primitive.indices) : null;
    const normals = primitive.attributes['NORMAL'] ? this.getAccessorData(primitive.attributes['NORMAL']) : null;
    const texCoords = primitive.attributes['TEXCOORD_0'] ? this.getAccessorData(primitive.attributes['TEXCOORD_0']) : null;
    const tangents = primitive.attributes['TANGENT'] ? this.getAccessorData(primitive.attributes['TANGENT']) : null;

    const myDrawable = new Gfx3Mesh();
    const vertexCount = indices ? indices.length : vertices.length / 3;

    myDrawable.beginVertices(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
      const n = indices ? indices[i] : i;
      const vx = vertices[n * 3 + 0];
      const vy = vertices[n * 3 + 1];
      const vz = vertices[n * 3 + 2];
      const ux = texCoords ? texCoords[n * 2 + 0] : 0.0;
      const uy = texCoords ? texCoords[n * 2 + 1] : 0.0;
      const nx = normals ? normals[n * 3 + 0] : 0.0;
      const ny = normals ? normals[n * 3 + 1] : 0.0;
      const nz = normals ? normals[n * 3 + 2] : 0.0;
      const tx = tangents ? tangents[n * 4 + 0] : 0.0;
      const ty = tangents ? tangents[n * 4 + 1] : 0.0;
      const tz = tangents ? tangents[n * 4 + 2] : 0.0;
      const tw = tangents ? tangents[n * 4 + 3] : 0.0;
      const binorm = tangents ? Utils.VEC3_SCALE(Utils.VEC3_CROSS([nx, ny, nz], [tx, ty, tz]), tw) : [0.0, 0.0, 0.0];
      myDrawable.defineVertex(vx, vy, vz, ux, uy, nx, ny, nz, tx, ty, tz, binorm[0], binorm[1], binorm[2]);
    }

    myDrawable.endVertices();

    await this.processMaterial(primitive.material, myDrawable);
    primitive.drawable = myDrawable;
    object.addDrawable(primitive.drawable);
  }

  async processMaterial(idx: number, drawable: Gfx3Mesh) {
    const gltfMaterial = this.root.materials[idx];
    if (gltfMaterial.material) {
      drawable.material = gltfMaterial.material;
      return;
    }

    let texture: Gfx3Texture | null = null;
    let normalMap: Gfx3Texture | null = null;
    let matColor: vec4;

    if ((gltfMaterial.pbrMetallicRoughness.baseColorTexture) && (gltfMaterial.pbrMetallicRoughness.baseColorTexture.index < this.root.textures.length)) {
      const imageID = this.root.textures[gltfMaterial.pbrMetallicRoughness.baseColorTexture.index].source;
      const image = this.root.images[imageID];
      texture = await gfx3TextureManager.loadTexture(DIRNAME(this.globalURL) + '/' + image.uri);
    }

    if ((gltfMaterial.normalTexture) && (gltfMaterial.normalTexture.index < this.root.textures.length)) {
      const imageID = this.root.textures[gltfMaterial.normalTexture.index].source;
      const image = this.root.images[imageID];
      normalMap = await gfx3TextureManager.loadTexture(DIRNAME(this.globalURL) + '/' + image.uri);
    }

    if (gltfMaterial.pbrMetallicRoughness.baseColorFactor) {
      matColor = gltfMaterial.pbrMetallicRoughness.baseColorFactor;
    }
    else {
      matColor = [1.0, 1.0, 1.0, 1.0];
    }

    drawable.material = {
      ambiant: [0.2, 0.2, 0.2],
      specular: [1.0, 0.0, 0.0, 4],
      color: matColor,
      lightning: true,
      texture: texture,
      normalMap: normalMap,
      envMap: null
    };
  }

  getAccessorData(idx: number) {
    const accessor = this.root.accessors[idx];
    const bufferView = this.root.bufferViews[accessor.bufferView];
    const buffer = this.root.buffers[bufferView.buffer];
    const bufferOffset = GET_BUFFER_OFFSET(accessor, bufferView);
    const bufferLength = accessor.count * ACCESSOR_SIZES[accessor.type];

    if (accessor.componentType == 5121) {
      return new Uint8Array(buffer.data, bufferOffset, bufferLength); // UNSIGNED_BYTE
    }
    else if (accessor.componentType == 5122) {
      return new Int16Array(buffer.data, bufferOffset, bufferLength); // SHORT
    }
    else if (accessor.componentType == 5123) {
      return new Uint16Array(buffer.data, bufferOffset, bufferLength); // UNSIGNED SHORT
    }
    else if (accessor.componentType == 5125) {
      return new Uint32Array(buffer.data, bufferOffset, bufferLength); // UNSIGNED INT
    }
    else if (accessor.componentType == 5126) {
      return new Float32Array(buffer.data, bufferOffset, bufferLength); // FLOAT
    }
    else {
      throw new Error('Gfx3MeshGLTF::getAccessorData(): component type unknown !');
    }
  }
}

export { Gfx3MeshGLTF };

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function GET_BUFFER_OFFSET(accessor: GLTFAccessor, bufferView: GLTFBufferView): number {
  let offset = bufferView.byteOffset ?? 0;
  offset += accessor.byteOffset ?? 0;
  return offset;
}

function DIRNAME(path: string): string {
  let arr = path.split('/');
  arr.pop();

  return arr.join('/');
}
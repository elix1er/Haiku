import { Utils } from '../core/utils';
import { Gfx3View } from './gfx3_view';
import { Gfx3Texture } from './gfx3_texture';

export const MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT = 256;

export interface VertexSubBuffer {
  vertices: Float32Array;
  offset: number;
  changed: boolean;
};

export interface UniformGroup {
  buffer: GPUBuffer;
  offset: number;
  entries: Array<GPUBindGroupEntry>;
};

class Gfx3Manager {
  adapter: GPUAdapter;
  device: GPUDevice;
  canvas: HTMLCanvasElement;
  ctx: GPUCanvasContext;
  depthTexture: GPUTexture;
  depthView: GPUTextureView;
  commandEncoder: GPUCommandEncoder;
  passEncoder: GPURenderPassEncoder;
  pipelines: Map<string, GPURenderPipeline>;
  vertexBuffer: GPUBuffer;
  vertexSubBuffers: Array<VertexSubBuffer>;
  vertexSubBuffersSize: number;

  views: Array<Gfx3View>;
  currentView: Gfx3View;

  constructor() {
    this.adapter = {} as GPUAdapter;
    this.device = {} as GPUDevice;
    this.canvas = {} as HTMLCanvasElement;
    this.ctx = {} as GPUCanvasContext;
    this.depthTexture = {} as GPUTexture;
    this.depthView = {} as GPUTextureView;
    this.commandEncoder = {} as GPUCommandEncoder;
    this.passEncoder = {} as GPURenderPassEncoder;
    this.pipelines = new Map<string, GPURenderPipeline>();
    this.vertexBuffer = {} as GPUBuffer;
    this.vertexSubBuffers = [];
    this.vertexSubBuffersSize = 0;

    this.views = [new Gfx3View()];
    this.currentView = this.views[0];
  }

  async initialize() {
    if (!navigator.gpu) {
      Utils.FAIL('This browser does not support webgpu');
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - navigator.gpu not found');
    }

    this.adapter = (await navigator.gpu.requestAdapter())!;
    if (!this.adapter) {
      Utils.FAIL('This browser appears to support WebGPU but it\'s disabled');
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Adapter not found');
    }

    this.device = await this.adapter.requestDevice();
    this.device.lost.then(() => {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Device has been lost');
    });

    this.canvas = <HTMLCanvasElement>document.getElementById('CANVAS_3D')!;
    if (!this.canvas) {
      throw new Error('Gfx3Manager::Gfx3Manager: CANVAS_3D not found');
    }

    this.ctx = this.canvas.getContext('webgpu')!;
    if (!this.ctx) {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Canvas does not support WebGPU');
    }

    this.ctx.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'opaque'
    });

    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.depthView = this.depthTexture.createView();
    this.vertexBuffer = this.device.createBuffer({ size: 0, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  beginDrawing(viewIndex: number): void {
    const view = this.views[viewIndex];
    const viewport = view.getViewport();
    const viewportX = this.canvas.width * viewport.xFactor;
    const viewportY = this.canvas.height * viewport.yFactor;
    const viewportWidth = this.canvas.width * viewport.widthFactor;
    const viewportHeight = this.canvas.height * viewport.heightFactor;
    const viewBgColor = view.getBgColor();

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.ctx.getCurrentTexture().createView(),
        clearValue: { r: viewBgColor[0], g: viewBgColor[1], b: viewBgColor[2], a: viewBgColor[3] },
        loadOp: 'clear',
        storeOp: 'store'
      }],
      depthStencilAttachment: {
        view: this.depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    });

    passEncoder.setViewport(viewportX, viewportY, viewportWidth, viewportHeight, 0, 1);
    passEncoder.setScissorRect(viewportX, viewportY, viewportWidth, viewportHeight);

    this.currentView = view;
    this.commandEncoder = commandEncoder;
    this.passEncoder = passEncoder;
  }

  endDrawing() {
    if (this.vertexSubBuffersSize > 0) {
      if (this.vertexSubBuffersSize != this.vertexBuffer.size) {
        this.vertexBuffer.destroy();
        this.vertexBuffer = this.device.createBuffer({ size: this.vertexSubBuffersSize, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  
        for (const sub of this.vertexSubBuffers) {
          this.device.queue.writeBuffer(this.vertexBuffer, sub.offset, sub.vertices);
          sub.changed = false;
        }
  
        return;
      }
  
      for (const sub of this.vertexSubBuffers) {
        if (sub.changed) {
          this.device.queue.writeBuffer(this.vertexBuffer, sub.offset, sub.vertices);
          sub.changed = false;
        }
      }
    }
  }

  beginRender(): void {}
  endRender(): void {
    this.passEncoder.end();
    this.device.queue.submit([this.commandEncoder.finish()]);
  }

  loadPipeline(id: string, vertexShader: string, fragmentShader: string, pipelineDesc: GPURenderPipelineDescriptor): GPURenderPipeline {
    if (this.pipelines.has(id)) {
      return this.pipelines.get(id)!;
    }

    if (pipelineDesc.vertex) {
      pipelineDesc.vertex.module = this.device.createShaderModule({
        code: vertexShader
      });
    }

    if (pipelineDesc.fragment) {
      pipelineDesc.fragment.module = this.device.createShaderModule({
        code: fragmentShader
      });
    }

    const pipeline = this.device.createRenderPipeline(pipelineDesc);
    this.pipelines.set(id, pipeline);
    return pipeline;
  }

  createVertexBuffer(size: number): VertexSubBuffer {
    const sub: VertexSubBuffer = {
      vertices: new Float32Array(size),
      offset: this.vertexSubBuffersSize,
      changed: false
    };

    this.vertexSubBuffers.push(sub);
    this.vertexSubBuffersSize += size;
    return sub;
  }

  destroyVertexBuffer(sub: VertexSubBuffer): void {
    const index = this.vertexSubBuffers.indexOf(sub);
    this.vertexSubBuffers.splice(index, 1);

    for (const item of this.vertexSubBuffers) {
      if (item.offset > sub.offset) {
        item.offset -= sub.vertices.byteLength;
      }
    }

    this.vertexSubBuffersSize -= sub.vertices.byteLength;
  }

  writeVertexBuffer(sub: VertexSubBuffer, vertices: Array<number>): void {
    sub.vertices = new Float32Array(vertices);
    sub.changed = true;
  }

  createUniformGroup(size: number): UniformGroup {
    return {
      buffer: this.device.createBuffer({ size: size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
      offset: 0,
      entries: []
    };    
  }

  destroyUniformGroup(uniformGroup: UniformGroup): void {
    uniformGroup.buffer.destroy();
    uniformGroup.offset = 0;
    uniformGroup.entries = [];
  }

  writeUniformGroup(uniformGroup: UniformGroup, binding: number, data: Float32Array): void {
    uniformGroup.entries[binding] = { binding: binding, resource: { buffer: uniformGroup.buffer, offset: uniformGroup.offset, size: data.byteLength } };
    this.device.queue.writeBuffer(uniformGroup.buffer, uniformGroup.offset, data);
    uniformGroup.offset += MIN_UNIFORM_BUFFER_OFFSET_ALIGNMENT;
  }

  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup {
    return this.device.createBindGroup(descriptor);
  }

  createTextureFromBitmap(bitmap?: ImageBitmap | HTMLCanvasElement): Gfx3Texture {
    if (!bitmap) {
      const canvas = document.createElement('canvas');
      canvas.getContext('2d');
      canvas.width = 1;
      canvas.height = 1;
      bitmap = canvas;
    }

    const gpuTexture = this.device.createTexture({
      size: [bitmap.width, bitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: gpuTexture }, [bitmap.width, bitmap.height]);

    const gpuSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });

    return { gpuTexture: gpuTexture, gpuSampler: gpuSampler };
  }

  createCubeMapFromBitmap(bitmaps?: Array<ImageBitmap | HTMLCanvasElement>): Gfx3Texture {
    if (!bitmaps || bitmaps.length == 0) {
      const canvas = document.createElement('canvas');
      canvas.getContext('2d');
      canvas.width = 1;
      canvas.height = 1;
      bitmaps = [];
      for (let i = 0; i < 6; i++) {
        bitmaps.push(canvas);
      }
    }

    const cubemapTexture = this.device.createTexture({
      dimension: '2d',
      // Create a 2d array texture.
      // Assume each image has the same size.
      size: [bitmaps[0].width, bitmaps[0].height, 6],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    for (let i = 0; i < bitmaps.length; i++) {
      const imageBitmap = bitmaps[i];
      this.device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: cubemapTexture, origin: [0, 0, i] },
        [imageBitmap.width, imageBitmap.height]
      );
    }

    const gpuSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });

    return { gpuTexture: cubemapTexture, gpuSampler: gpuSampler };
  }

  createTextureBinding(pipeline: GPURenderPipeline, sampler: GPUSampler, texture: GPUTexture, bindGroupLayoutIndex: number, createViewDescriptor: GPUTextureViewDescriptor = {}): GPUBindGroupDescriptor {
    return {
      layout: pipeline.getBindGroupLayout(bindGroupLayoutIndex),
      entries: [{
        binding: 0,
        resource: sampler
      }, {
        binding: 1,
        resource: texture.createView(createViewDescriptor)
      }]
    };
  }

  getScreenPosition(viewIndex: number, x: number, y: number, z: number): vec2 {
    const view = this.views[viewIndex];
    const viewport = view.getViewport();
    const viewportWidth = (this.canvas.width * viewport.widthFactor);
    const viewportHeight = (this.canvas.height * viewport.heightFactor);

    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getClipMatrix());
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getProjectionMatrix(viewportWidth / viewportHeight));
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getCameraViewMatrix());

    const pos = Utils.MAT4_MULTIPLY_BY_VEC4(matrix, [x, y, z, 1]);
    const viewportRealWidth = viewportWidth / window.devicePixelRatio;
    const viewportRealHeight = viewportHeight / window.devicePixelRatio;

    pos[0] = pos[0] / pos[3];
    pos[1] = pos[1] / pos[3];
    pos[0] = ((pos[0] + 1.0) * viewportRealWidth) / (2.0);
    pos[1] = viewportRealHeight - ((pos[1] + 1.0) * viewportRealHeight) / (2.0);
    return [pos[0], pos[1]];
  }

  getScreenNormalizedPosition(viewIndex: number, x: number, y: number, z: number): vec2 {
    let view = this.views[viewIndex];
    let viewport = view.getViewport();
    let viewportWidth = this.canvas.width * viewport.widthFactor;
    let viewportHeight = this.canvas.height * viewport.heightFactor;

    let matrix = Utils.MAT4_IDENTITY();
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getClipMatrix());
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getProjectionMatrix(viewportWidth / viewportHeight));
    matrix = Utils.MAT4_MULTIPLY(matrix, view.getCameraViewMatrix());

    let pos = Utils.MAT4_MULTIPLY_BY_VEC4(matrix, [x, y, z, 1]);
    return [pos[0] / pos[3], pos[1] / pos[3]];
  }

  getCurrentProjectionMatrix(): mat4 {
    const viewport = this.currentView.getViewport();
    const viewportWidth = this.canvas.width * viewport.widthFactor;
    const viewportHeight = this.canvas.height * viewport.heightFactor;
    return this.currentView.getPCMatrix(viewportWidth / viewportHeight);
  }

  getCurrentViewProjectionMatrix(): mat4 {
    const viewport = this.currentView.getViewport();
    const viewportWidth = this.canvas.width * viewport.widthFactor;
    const viewportHeight = this.canvas.height * viewport.heightFactor;
    return this.currentView.getVPCMatrix(viewportWidth / viewportHeight);
  }

  getWidth(): number {
    return this.canvas.width;
  }

  getHeight(): number {
    return this.canvas.height;
  }

  getContext(): GPUCanvasContext {
    return this.ctx;
  }

  getDevice(): GPUDevice {
    return this.device;
  }

  getPassEncoder(): GPURenderPassEncoder {
    return this.passEncoder;
  }

  getView(index: number): Gfx3View {
    return this.views[index];
  }

  getNumViews(): number {
    return this.views.length;
  }

  addView(view: Gfx3View): void {
    this.views.push(view);
  }

  changeView(index: number, view: Gfx3View): void {
    this.views[index] = view;
  }

  removeView(view: Gfx3View): void {
    this.views.splice(this.views.indexOf(view), 1);
  }

  releaseViews(): void {
    this.views = [];
  }

  getCurrentView(): Gfx3View {
    return this.currentView;
  }

  getVertexBuffer(): GPUBuffer {
    return this.vertexBuffer;
  }

  handleWindowResize(): void {
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

    this.depthTexture.destroy();
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.depthView = this.depthTexture.createView();
  }
}

const gfx3Manager = new Gfx3Manager();
await gfx3Manager.initialize();

export { Gfx3Manager };
export { gfx3Manager };
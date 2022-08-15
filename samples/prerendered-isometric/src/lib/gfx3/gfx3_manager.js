let { Utils } = require('../core/utils');
let { Gfx3View } = require('./gfx3_view');
let { Gfx3Texture } = require('./gfx3_texture');
let { CREATE_MESH_SHADER_RES, CREATE_DEBUG_SHADER_RES } = require('./gfx3_shaders');

let CMD_MATRIX_BUFFER_DATA = 0;
let CMD_MATRIX_BUFFER_OFFSET = 1;
let CMD_VERTEX_BUFFER_DATA = 2;
let CMD_VERTEX_BUFFER_SIZE = 3;
let CMD_VERTEX_COUNT = 4;
let CMD_VERTEX_BUFFER_OFFSET = 5;
let CMD_TEXTURE_GROUP = 6;

class Gfx3Manager {
  constructor() {
    this.adapter = null;
    this.device = null;
    this.canvas = null;
    this.ctx = null;
    this.depthTexture = null;
    this.depthView = null;

    this.meshPipeline = null;
    this.meshVertexBuffer = null;
    this.meshMatrixBuffer = null;
    this.meshCommands = [];
    this.meshVertexCount = 0;

    this.debugPipeline = null;
    this.debugVertexBuffer = null;
    this.debugMatrixBuffer = null;
    this.debugCommands = [];
    this.debugVertexCount = 0;

    this.views = [new Gfx3View()];
    this.currentView = this.views[0];

    this.showDebug = false;
    this.vpcMatrix = Utils.MAT4_IDENTITY();
    this.defaultTexture = new Gfx3Texture();
  }

  async initialize() {
    if (!navigator.gpu) {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - navigator.gpu not found');
    }

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Adapter not found');
    }

    this.device = await this.adapter.requestDevice();
    this.device.lost.then(() => {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Device has been lost');
    });

    this.canvas = document.getElementById('CANVAS_3D');
    this.ctx = this.canvas.getContext('webgpu');
    if (!this.ctx) {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Canvas does not support WebGPU');
    }

    this.ctx.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'opaque'
    });

    let devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.depthView = this.depthTexture.createView();

    this.meshPipeline = await CREATE_MESH_SHADER_RES(this.device);
    this.meshVertexBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    this.meshMatrixBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    this.debugPipeline = await CREATE_DEBUG_SHADER_RES(this.device);
    this.debugVertexBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    this.debugMatrixBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    let res = await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjkA43/A8AAtcBo43Eu70AAAAASUVORK5CYII=');
    let defaultImg = await res.blob();
    this.defaultTexture = this.createTextureFromBitmap(await createImageBitmap(defaultImg));

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  beginDrawing(viewIndex) {
    let view = this.views[viewIndex];
    let viewport = view.getViewport();
    let viewportX = this.canvas.width * viewport.xFactor;
    let viewportY = this.canvas.height * viewport.yFactor;
    let viewportWidth = this.canvas.width * viewport.widthFactor;
    let viewportHeight = this.canvas.height * viewport.heightFactor;
    let viewBgColor = view.getBgColor();

    this.vpcMatrix = Utils.MAT4_IDENTITY();
    this.vpcMatrix = Utils.MAT4_MULTIPLY(this.vpcMatrix, view.getClipMatrix());
    this.vpcMatrix = Utils.MAT4_MULTIPLY(this.vpcMatrix, view.getProjectionMatrix(viewportWidth / viewportHeight));
    this.vpcMatrix = Utils.MAT4_MULTIPLY(this.vpcMatrix, view.getCameraViewMatrix());

    this.commandEncoder = this.device.createCommandEncoder();
    this.passEncoder = this.commandEncoder.beginRenderPass({
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

    this.passEncoder.setViewport(viewportX, viewportY, viewportWidth, viewportHeight, 0, 1);
    this.passEncoder.setScissorRect(viewportX, viewportY, viewportWidth, viewportHeight);
    this.currentView = view;
    this.meshVertexCount = 0;
    this.meshCommands = [];
    this.debugVertexCount = 0;
    this.debugCommands = [];
  }

  endDrawing() {
    // mesh shader
    // ------------------------------------------------------------------------------------
    this.passEncoder.setPipeline(this.meshPipeline);

    this.meshVertexBuffer.destroy();
    this.meshVertexBuffer = this.device.createBuffer({
      size: this.meshVertexCount * 5 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.meshMatrixBuffer.destroy();
    this.meshMatrixBuffer = this.device.createBuffer({
      size: this.meshCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    for (let cmd of this.meshCommands) {
      let meshMatrixBinding = this.device.createBindGroup({
        layout: this.meshPipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: this.meshMatrixBuffer,
            offset: cmd[CMD_MATRIX_BUFFER_OFFSET],
            size: 16 * 4
          }
        }]
      });

      this.device.queue.writeBuffer(this.meshVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], new Float32Array(cmd[CMD_VERTEX_BUFFER_DATA]));
      this.device.queue.writeBuffer(this.meshMatrixBuffer, cmd[CMD_MATRIX_BUFFER_OFFSET], new Float32Array(cmd[CMD_MATRIX_BUFFER_DATA]));
      this.passEncoder.setBindGroup(0, meshMatrixBinding);
      this.passEncoder.setBindGroup(1, cmd[CMD_TEXTURE_GROUP]);
      this.passEncoder.setVertexBuffer(0, this.meshVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], cmd[CMD_VERTEX_BUFFER_SIZE]);
      this.passEncoder.draw(cmd[CMD_VERTEX_COUNT]);
    }

    // debug shader
    // ------------------------------------------------------------------------------------
    this.passEncoder.setPipeline(this.debugPipeline);

    this.debugVertexBuffer.destroy();
    this.debugVertexBuffer = this.device.createBuffer({
      size: this.debugVertexCount * 6 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.debugMatrixBuffer.destroy();
    this.debugMatrixBuffer = this.device.createBuffer({
      size: this.debugCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    for (let cmd of this.debugCommands) {
      let debugMatrixBinding = this.device.createBindGroup({
        layout: this.debugPipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: this.debugMatrixBuffer,
            offset: cmd[CMD_MATRIX_BUFFER_OFFSET],
            size: 4 * 16
          }
        }]
      });

      this.device.queue.writeBuffer(this.debugVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], new Float32Array(cmd[CMD_VERTEX_BUFFER_DATA]));
      this.device.queue.writeBuffer(this.debugMatrixBuffer, cmd[CMD_MATRIX_BUFFER_OFFSET], new Float32Array(cmd[CMD_MATRIX_BUFFER_DATA]));
      this.passEncoder.setBindGroup(0, debugMatrixBinding);
      this.passEncoder.setVertexBuffer(0, this.debugVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], cmd[CMD_VERTEX_BUFFER_SIZE]);
      this.passEncoder.draw(cmd[CMD_VERTEX_COUNT]);
    }

    // submit to graphics pipeline
    // ------------------------------------------------------------------------------------
    this.passEncoder.end();
    this.device.queue.submit([this.commandEncoder.finish()]);
  }

  createTextureFromBitmap(bitmap) {
    let texture = new Gfx3Texture();

    texture.gpu = this.device.createTexture({
      size: [bitmap.width, bitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: texture.gpu }, [bitmap.width, bitmap.height]);

    texture.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });

    texture.group = this.device.createBindGroup({
      layout: this.meshPipeline.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: texture.sampler
      }, {
        binding: 1,
        resource: texture.gpu.createView()
      }]
    });

    return texture;
  }

  drawMesh(modelMatrix, vertexCount, vertices, texture) {
    let cmd = [];
    cmd[CMD_MATRIX_BUFFER_DATA] = Utils.MAT4_MULTIPLY(this.vpcMatrix, modelMatrix);
    cmd[CMD_MATRIX_BUFFER_OFFSET] = this.meshCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment;
    cmd[CMD_VERTEX_BUFFER_DATA] = vertices;
    cmd[CMD_VERTEX_BUFFER_OFFSET] = this.meshVertexCount * 5 * 4;
    cmd[CMD_VERTEX_BUFFER_SIZE] = vertexCount * 5 * 4;
    cmd[CMD_VERTEX_COUNT] = vertexCount;
    cmd[CMD_TEXTURE_GROUP] = texture ? texture.group : this.defaultTexture.group;
    this.meshVertexCount += vertexCount;
    this.meshCommands.push(cmd);
  }

  drawDebugLineList(modelMatrix, vertexCount, vertices) {
    if (!this.showDebug) {
      return;
    }

    let cmd = [];
    cmd[CMD_MATRIX_BUFFER_DATA] = Utils.MAT4_MULTIPLY(this.vpcMatrix, modelMatrix);
    cmd[CMD_MATRIX_BUFFER_OFFSET] = this.debugCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment;
    cmd[CMD_VERTEX_BUFFER_DATA] = vertices;
    cmd[CMD_VERTEX_BUFFER_OFFSET] = this.debugVertexCount * 6 * 4;
    cmd[CMD_VERTEX_BUFFER_SIZE] = vertexCount * 6 * 4;
    cmd[CMD_VERTEX_COUNT] = vertexCount;
    this.debugVertexCount += vertexCount;
    this.debugCommands.push(cmd);
  }

  getScreenPosition(viewIndex, x, y, z) {
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

  getWidth() {
    return this.canvas.width;
  }

  getHeight() {
    return this.canvas.height;
  }

  getContext() {
    return this.ctx;
  }

  getDefaultTexture() {
    return this.defaultTexture;
  }

  getView(index) {
    return this.views[index];
  }

  getNumViews() {
    return this.views.length;
  }

  addView(view) {
    this.views.push(view);
  }

  changeView(index, view) {
    this.views[index] = view;
  }

  removeView(view) {
    this.views.splice(this.views.indexOf(view), 1);
  }

  releaseViews() {
    this.views = [];
  }

  getCurrentView() {
    return this.currentView;
  }

  setShowDebug(showDebug) {
    this.showDebug = showDebug;
  }

  handleWindowResize() {
    let devicePixelRatio = window.devicePixelRatio || 1;
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

module.exports.gfx3Manager = new Gfx3Manager();
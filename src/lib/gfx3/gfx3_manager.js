import { Utils } from '../core/utils.js';
import { BoundingBox } from '../bounding_box/bounding_box.js';
import { Gfx3View } from './gfx3_view.js';
import { Gfx3Texture } from './gfx3_texture.js';
import { Gfx3Node } from './gfx3_node.js';

import { CREATE_MESH_SHADER_RES, CREATE_DEBUG_SHADER_RES } from './gfx3_shaders.js';

let CMD_MATRIX_BUFFER_DATA = 0;
let CMD_MATRIX_BUFFER_OFFSET = 1;
let CMD_VERTEX_BUFFER_DATA = 2;
let CMD_VERTEX_BUFFER_SIZE = 3;
let CMD_VERTEX_COUNT = 4;
let CMD_VERTEX_BUFFER_OFFSET = 5;
let CMD_NORMAL_MATRIX_BUFFER_DATA = 6;
let CMD_MATERIAL_ID = 7;

let CMD_TEXTURE_GROUP = 6;
let CMD_NORMAL_MATRIX_BUFFER_OFFSET = 7
let CMD_NORMALMAP_GROUP = 8;
let CMD_MATERIAL_AMBIANT_OFFSET = 9;
let CMD_MATERIAL_COLOR_OFFSET = 10;
let CMD_MATERIAL_SPECULAR_OFFSET = 11;
let CMD_PARAMS_OFFSET = 12;



class Gfx3Material{
  constructor(id, color, texture, normalmap)
  {
    this.id = id;
    this.ambiant = [0.2,0.2,0.2];
    this.specular = [1.0,0.0,0.0 , 4];
    this.color = color;
    this.texture = texture;
    this.normalmap = normalmap;
    this.lightning = false;
    
  }
}


class Gfx3DrawableNode extends Gfx3Node {
  constructor(drawable, id)
  {
    super(id);
    this.drawable = drawable;
  }

  draw()
  {
    this.drawable.draw();
  }

  delete()
  {
    this.drawable.delete();
    super.delete();
  }

  getDrawable()
  {
    return this.drawable;
  }

  getTotalBoundingBox(bounds, mat)
  {
      let m = this.getModelMatrix();
      var newmat;
      
      if(mat !== null)
        newmat = Utils.MAT4_MULTIPLY(m, mat);
      else
        newmat =  m;

       let pts= this.drawable.getBoxPts();
       for(let pt of pts)
       {
          let tp = Utils.MAT4_MULTIPLY_BY_VEC4(newmat, pt);
          bounds.min = Utils.VEC3_MIN(bounds.min, tp);
          bounds.max = Utils.VEC3_MAX(bounds.max, tp);
       }        
          
      for(let child of this.children)
      {
        child.getTotalBoundingBox(bounds, newmat);
      }
  }


  getNodeBoundingBox(id, mat)
  {
    let m = this.getModelMatrix();
    var newmat;
    
    if(mat !== null)
      newmat = Utils.MAT4_MULTIPLY(m, mat);
    else
      newmat =  m;

      if(this.id === id)
      {
          let pts= this.drawable.getBoxPts();
          let minV = null;
          let maxV = null;

          for(pt of pts)
          {
              let tp = Utils.MAT4_MULTIPLY_BY_VEC4(newmat, pt);

              minV = Utils.VEC3_MIN(minV, tp);
              maxV = Utils.VEC3_MAX(maxV, tp);
        }
        return new BoundingBox(minV, maxV);
      }

      for(let child of this.children)
      {
        let found = child.getNodeBOundingBox(id, newmat);
        if(found !== null)
          return found;
      }
      return null;
  }


}

class Gfx3Manager {
  constructor() {
    this.adapter = null;
    this.device = null;
    this.canvas = null;
    this.ctx = null;
    this.depthTexture = null;
    this.depthView = null;
    this.materials = [];

    this.meshPipeline = null;
    this.meshVertexBuffer = null;
    this.meshMatrixBuffer = null;
    this.meshCommands = [];
    this.meshVertexSize = 0;

    this.debugPipeline = null;
    this.debugVertexBuffer = null;
    this.debugMatrixBuffer = null;
    this.debugCommands = [];
    this.debugVertexCount = 0;

    

    this.views = [new Gfx3View()];
    this.currentView = this.views[0];

    this.showDebug = true;
    this.vpcMatrix = Utils.MAT4_IDENTITY();
    this.defaultTexture = new Gfx3Texture();
    this.defaultNormalMap = new Gfx3Texture();

    this.xframe=0;
  }


  deleteVertexBufferRange(id)
  {
    let deletedRange = this.findBufferRange(id);
    let rangeSize = this.findBufferRangeSize(id);

    console.log("delete vertex buffer ( experimental ! )");

    this.meshVertexSize -= rangeSize;

    let newMeshVertexBuffer = this.device.createBuffer({
      size: this.meshVertexSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });

    if(this.meshVertexSize > 0 )
    {
      /* copy everything up to deleted range */

      let commandEncoder = this.device.createCommandEncoder();
      commandEncoder.copyBufferToBuffer(
        gfx3Manager.meshVertexBuffer /* source buffer */,
        0 /* source offset */,
        newMeshVertexBuffer /* destination buffer */,
        0 /* destination offset */,
        deletedRange.vertex /* size */
      );
      
      // Submit GPU commands.
      const gpuCommands = commandEncoder.finish();
      this.device.queue.submit([gpuCommands]);

      /* copy after deleted range to deleted offset */
      commandEncoder = this.device.createCommandEncoder();
      commandEncoder.copyBufferToBuffer(
        gfx3Manager.meshVertexBuffer /* source buffer */,
        deletedRange.vertex + rangeSize /* source offset */,
        newMeshVertexBuffer /* destination buffer */,
        deletedRange.vertex /* destination offset */,
        this.meshVertexSize - deletedRange.vertex /* size */
      );
      
      // Submit GPU commands.
      const gpuCommands2 = commandEncoder.finish();
      this.device.queue.submit([gpuCommands2]);

      this.meshVertexBuffer.destroy();
      this.meshVertexBuffer = newMeshVertexBuffer;
    }

    /* update vertex offset of moved drawables */
    for(let range in this.Ranges)
    {
      if(range.vertex > deletedRange.vertex)
      {
        range.vertex -= rangeSize;
      }
    }

    let n=0;
    while(n<this.Ranges)
    {
      if(this.Ranges[n].id == id)
        this.Ranges.slice(n, 1);
      else
        n++;
    }
  }

  newMaterial(color, texture, normalmap)
  {
    let newMat = new Gfx3Material(this.materials.length + 1, color, texture, normalmap);
    this.materials.push(newMat);
    return newMat.id;
  }

  setMaterialTexture(id, texture)
  {
    for(let n=0;n<this.materials.length;n++)
    {
      if(this.materials[n].id == id)
      {
        this.materials[n].texture = texture;
        return true;
      }
    }

    return false;
  }

  enableLightning(id, on){
    for(let n=0;n<this.materials.length;n++)
    {
      if(this.materials[n].id == id)
      {
        this.materials[n].lightning = on;
        return true;
      }
    }

    return false;
  }


  setNormalMapTexture(id, normalmap)
  {
    for(let n=0;n<this.materials.length;n++)
    {
      if(this.materials[n].id == id)
      {
        this.materials[n].normalmap = normalmap;
        break;
      }
    }
  }
  
  findMaterial(id)
  {
    for(let n=0;n<this.materials.length;n++)
    {
      if(this.materials[n].id == id)
        return this.materials[n];
    }

    return null;
  }

  async initialize() {
    if (!navigator.gpu) {
      Utils.FAIL('This browser does not support webgpu');
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - navigator.gpu not found');
    }

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      Utils.FAIL('This browser appears to support WebGPU but it\'s disabled');
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Adapter not found');
    }

    this.device = await this.adapter.requestDevice();
    this.device.lost.then(() => {
      throw new Error('Gfx3Manager::Gfx3Manager: WebGPU cannot be initialized - Device has been lost');
    });

    this.canvas = document.getElementById('CANVAS_3D');
    if (!this.canvas) {
      throw new Error('Gfx3Manager::Gfx3Manager: CANVAS_3D not found');
    }

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

    //this.graphMatrixBuffer = this.device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    let res = await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjkA43/A8AAtcBo43Eu70AAAAASUVORK5CYII=');
    let defaultImg = await res.blob();
    this.defaultTexture = this.createTextureFromBitmap(await createImageBitmap(defaultImg));
    this.defaultNormalMap = this.createNormalMapFromBitmap(await createImageBitmap(defaultImg));
    
    this.Ranges=[];
    this.RangesIds=1;
    window.addEventListener('resize', this.handleWindowResize.bind(this));

    this.camMatrixBuffer= this.device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.lightPosBuffer= this.device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.camPosBuffer= this.device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    
  
    this.meshVertexSize = 0;
    this.nextMatrixPos = 0;
    console.log('init');

  }

  getBufferRangeId(size)
  {
    let newOffset = this.getBufferRange(size);
    let myId = this.RangesIds++;
    this.Ranges.push({'offsets' : newOffset, infos: {size : size, id :myId }});
    return myId;
  }
  findBufferRangeSize(id)
  {
    for(let range of this.Ranges)
    {
      if(range.infos.id == id)
        return range.infos.size;
    }
    return null;

  }
  findBufferRange(id)
  {
    for(let range of this.Ranges)
    {
      if(range.infos.id == id)
        return range.offsets;
    }
    return null;
  }

  getBufferRange(size)
  {
    console.log("new buffer "+size);

    let newOffset={vertex : 0};

    let newMeshVertexBuffer = this.device.createBuffer({
      size: this.meshVertexSize + size,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });

    if(this.meshVertexSize > 0 )
    {
      let commandEncoder = this.device.createCommandEncoder();
      commandEncoder.copyBufferToBuffer(
        this.meshVertexBuffer /* source buffer */,
        0 /* source offset */,
        newMeshVertexBuffer /* destination buffer */,
        0 /* destination offset */,
        this.meshVertexSize /* size */
      );
      
      // Submit GPU commands.
      const gpuCommands = commandEncoder.finish();
      this.device.queue.submit([gpuCommands]);
      this.meshVertexBuffer.destroy();
    }

    newOffset.vertex = this.meshVertexSize;

    this.meshVertexSize += size;
    this.meshVertexBuffer = newMeshVertexBuffer;
    return newOffset;
  }

  commitBuffer(rangeId, vertices){

    let bufferOffset = this.findBufferRange(rangeId);
    this.device.queue.writeBuffer(this.meshVertexBuffer, bufferOffset.vertex, new Float32Array(vertices));    
  }

  newDrawable(drawable)
  {
    let newNode =  new Gfx3DrawableNode(drawable, this.nodesIds++)
    return newNode;
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


    let valx =  Math.cos((this.xframe++) / 100);
    let valz = (Math.sin((this.xframe++) / 100) + 1)-10;

    this.lightPos = [valx, 1, valz];

    this.device.queue.writeBuffer(this.camMatrixBuffer, 0, new Float32Array(this.vpcMatrix));
    this.device.queue.writeBuffer(this.lightPosBuffer, 0, new Float32Array(this.lightPos));
    this.device.queue.writeBuffer(this.camPosBuffer, 0, new Float32Array(view.getPosition()));
    

    this.passEncoder.setViewport(viewportX, viewportY, viewportWidth, viewportHeight, 0, 1);
    this.passEncoder.setScissorRect(viewportX, viewportY, viewportWidth, viewportHeight);
    this.currentView = view;

    this.nodesIds = 1;
    this.sceneRoot = new Gfx3Node(this.nodesIds++);

    //this.graphMatrixBuffer.destroy();
    
    this.MatrixbufferOffset=0;

    this.meshCommands = [];
    this.debugVertexCount = 0;
    this.debugCommands = [];


  }

  endDrawing() {
    // mesh shader
    // ------------------------------------------------------------------------------------
    this.passEncoder.setPipeline(this.meshPipeline);

    this.meshMatrixBuffer.destroy();
    this.meshMatrixBuffer = this.device.createBuffer({
    size: this.meshCommands.length * this.adapter.limits.minUniformBufferOffsetAlignment * 6,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST| GPUBufferUsage.COPY_SRC
  });
  
 
    this.meshMatrixBufferSize = 0;

    if( this.meshVertexBuffer != null)
    {

      for (let cmd of this.meshCommands) {

       
        let material = this.findMaterial( cmd[CMD_MATERIAL_ID]);

        if(material === null)
          continue;

        let params =[];

        if (material.texture  !== null) {
          params[0]=1;
          this.passEncoder.setBindGroup(1,   material.texture.group);
        }else{
          params[0]=0;
          this.passEncoder.setBindGroup(1, this.defaultTexture.group);
        }

        if(material.lightning)
          params[1] = 1;
        else
          params[1] = 0;

        if (material.normalmap!== null){
          params[2]=1;
          this.passEncoder.setBindGroup(2, material.normalmap.group);;
        }
        else{
          params[2]=0;
          this.passEncoder.setBindGroup(2, this.defaultNormalMap.group);
        }

        params[3]=0;

        let bentries =  [
          {
            binding: 0,
            resource: {
              buffer: this.camMatrixBuffer,
              offset: 0,
              size: 16 * 4
            }
          },{
            binding: 1,
            resource: {
              buffer: this.lightPosBuffer,
              offset: 0,
              size: 16 * 4
            }
          }
        ]

            
        this.device.queue.writeBuffer(this.meshMatrixBuffer, this.meshMatrixBufferSize, new Float32Array(cmd[CMD_MATRIX_BUFFER_DATA])); 
        bentries.push({binding: 2,resource: { buffer: this.meshMatrixBuffer, offset: this.meshMatrixBufferSize, size: 16 * 4}});
        this.meshMatrixBufferSize += this.adapter.limits.minUniformBufferOffsetAlignment;
    
        this.device.queue.writeBuffer(this.meshMatrixBuffer, this.meshMatrixBufferSize, new Float32Array(cmd[CMD_NORMAL_MATRIX_BUFFER_DATA]));
        bentries.push({binding: 3,resource: { buffer: this.meshMatrixBuffer, offset: this.meshMatrixBufferSize, size: 16 * 4}});
        this.meshMatrixBufferSize += this.adapter.limits.minUniformBufferOffsetAlignment;
    
        this.device.queue.writeBuffer(this.meshMatrixBuffer, this.meshMatrixBufferSize, new Float32Array(material.ambiant));
        bentries.push({binding: 4,resource: { buffer: this.meshMatrixBuffer, offset: this.meshMatrixBufferSize, size: 16 * 4}});
        this.meshMatrixBufferSize += this.adapter.limits.minUniformBufferOffsetAlignment;
    
        this.device.queue.writeBuffer(this.meshMatrixBuffer, this.meshMatrixBufferSize, new Float32Array(material.color));
        bentries.push({binding: 5,resource: { buffer: this.meshMatrixBuffer, offset: this.meshMatrixBufferSize, size: 16 * 4}});
        this.meshMatrixBufferSize += this.adapter.limits.minUniformBufferOffsetAlignment;
        
        this.device.queue.writeBuffer(this.meshMatrixBuffer, this.meshMatrixBufferSize, new Float32Array(material.specular));
        bentries.push({binding: 6,resource: { buffer: this.meshMatrixBuffer, offset: this.meshMatrixBufferSize, size: 16 * 4}});
        this.meshMatrixBufferSize += this.adapter.limits.minUniformBufferOffsetAlignment;
    
        this.device.queue.writeBuffer(this.meshMatrixBuffer, this.meshMatrixBufferSize, new Float32Array(params));
        bentries.push({binding: 7,resource: { buffer: this.meshMatrixBuffer, offset: this.meshMatrixBufferSize, size: 16 * 4}});
        this.meshMatrixBufferSize += this.adapter.limits.minUniformBufferOffsetAlignment;

        bentries.push({
          binding: 8,
          resource: {
            buffer: this.camPosBuffer,
            offset: 0,
            size: 16 * 4
          }
        });
    
      
        let meshMatrixBinding = this.device.createBindGroup({
          layout: this.meshPipeline.getBindGroupLayout(0),
          entries:bentries
        });
         

        this.passEncoder.setBindGroup(0, meshMatrixBinding);
        this.passEncoder.setVertexBuffer(0, this.meshVertexBuffer, cmd[CMD_VERTEX_BUFFER_OFFSET], cmd[CMD_VERTEX_BUFFER_SIZE]);
        this.passEncoder.draw(cmd[CMD_VERTEX_COUNT]);
      }
  
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
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat'
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

  createNormalMapFromBitmap(bitmap) {
    let texture = new Gfx3Texture();

    texture.gpu = this.device.createTexture({
      size: [bitmap.width, bitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: texture.gpu }, [bitmap.width, bitmap.height]);

    texture.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });

    texture.group = this.device.createBindGroup({
      layout: this.meshPipeline.getBindGroupLayout(2),
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


  drawNode(node) {

    this.sceneRoot.addChild(node);

  }
  
  drawMesh(matrix, normal_matrix, materialID, rangeId, vertexCount, vertexSize) {

    let offsets = this.findBufferRange(rangeId);

    if(offsets == null)
      return;

    let cmd=[];
    cmd[CMD_MATERIAL_ID] = materialID;
    cmd[CMD_MATRIX_BUFFER_DATA] = matrix;
    cmd[CMD_NORMAL_MATRIX_BUFFER_DATA] = normal_matrix;
    cmd[CMD_VERTEX_BUFFER_OFFSET] =  offsets.vertex;
    cmd[CMD_VERTEX_BUFFER_SIZE] = vertexCount * vertexSize;
    cmd[CMD_VERTEX_COUNT] = vertexCount;

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

    pos[0] = pos[0]/pos[3];
    pos[1] = pos[1]/pos[3];

    pos[0] = ((pos[0] + 1.0) * viewportWidth) /  ( 2.0);
    pos[1] = viewportHeight - ((pos[1] + 1.0) * viewportHeight) / ( 2.0);

    return [pos[0], pos[1]];
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

export const gfx3Manager = new Gfx3Manager();
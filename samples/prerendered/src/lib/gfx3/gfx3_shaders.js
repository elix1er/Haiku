module.exports.CREATE_MESH_SHADER_RES = async function (device) {
  let pipeline = await device.createRenderPipelineAsync({
    label: 'Basic Pipline',
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: `
        @binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;

        struct VertexOutput {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragUV : vec2<f32>
        };

        @vertex
        fn main(
          @location(0) position : vec4<f32>,
          @location(1) uv : vec2<f32>
        ) -> VertexOutput {
          var output : VertexOutput;
          output.Position = mvpMatrix * position;
          output.fragUV = uv;
          return output;
        }`,
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 5 * 4, // 3 position 2 uv,
        attributes: [{
          label: 'position',
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3'
        },{
          label: 'uv',
          shaderLocation: 1,
          offset: 3 * 4,
          format: 'float32x2'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        @group(1) @binding(0) var Sampler: sampler;
        @group(1) @binding(1) var Texture: texture_2d<f32>;
      
        @fragment
        fn main(
          @location(0) fragUV: vec2<f32>
        ) -> @location(0) vec4<f32> {
          return textureSample(Texture, Sampler, fragUV);
        }`
      }),
      entryPoint: 'main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
      frontFace: 'ccw'
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus'
    }
  });

  return pipeline;
}

module.exports.CREATE_DEBUG_SHADER_RES = async function (device) {
  let pipeline = await device.createRenderPipelineAsync({
    label: 'Line List Debug Pipline',
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: `
        @binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;

        struct VertexOutput {
          @builtin(position) Position : vec4<f32>,
          @location(0) color : vec3<f32>
        };

        @vertex
        fn main(
          @location(0) position : vec4<f32>,
          @location(1) color : vec3<f32>
        ) -> VertexOutput {
          var output : VertexOutput;
          output.Position = mvpMatrix * position;
          output.color = color;
          return output;
        }`,
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 6 * 4, // 3xf position + 3xf color
        attributes: [{
          label: 'position',
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3'
        },{
          label: 'color',
          shaderLocation: 1,
          offset: 3 * 4,
          format: 'float32x3'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        @fragment
        fn main(
          @location(0) color: vec3<f32>
        ) -> @location(0) vec4<f32> {
          return vec4(color, 1);
        }`
      }),
      entryPoint: 'main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'line-list',
      cullMode: 'back',
      frontFace: 'ccw'
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus'
    }
  });

  return pipeline;
}
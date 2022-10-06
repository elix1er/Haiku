export const SHADER_VERTEX_ATTR_COUNT = 5;
export const SHADER_UNIFORM_ATTR_COUNT = 2;

export const PIPELINE_DESC: any = {
  label: 'Sprite pipeline',
  layout: 'auto',
  vertex: {
    entryPoint: 'main',
    buffers: [{
      arrayStride: SHADER_VERTEX_ATTR_COUNT * 4, // 3 position 2 uv,
      attributes: [{
        shaderLocation: 0, /*position*/
        offset: 0,
        format: 'float32x3'
      }, {
        shaderLocation: 1, /*uv*/
        offset: 3 * 4,
        format: 'float32x2'
      }]
    }]
  },
  fragment: {
    entryPoint: 'main',
    targets: [{
      format: navigator.gpu.getPreferredCanvasFormat(),
      blend: {
        color: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        },
        alpha: {
          srcFactor: 'one',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        }
      }
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
};

export const VERTEX_SHADER = `
@group(0) @binding(0) var<uniform> mvpcMatrix: mat4x4<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) fragUV: vec2<f32>
};

@vertex
fn main(
  @location(0) position : vec4<f32>,
  @location(1) uv : vec2<f32>
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = mvpcMatrix * position;
  output.fragUV = uv;
  return output;
}`;

export const FRAGMENT_SHADER = `
@group(1) @binding(0) var Sampler: sampler;
@group(1) @binding(1) var Texture: texture_2d<f32>;

@fragment
fn main(
  @location(0) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
  var textureColor:vec4<f32> = (textureSample(Texture, Sampler, fragUV));
  if (textureColor.a == 0)
  {
    discard;
  }

  return textureColor;
}`;
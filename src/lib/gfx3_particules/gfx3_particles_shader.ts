export const SHADER_VERTEX_ATTR_COUNT = 12;

export const PIPELINE_DESC: any = {
  label: 'Particles pipeline',
  layout: 'auto',
  vertex: {
    entryPoint: 'main',
    buffers: [{
      arrayStride: SHADER_VERTEX_ATTR_COUNT * 4,
      attributes: [{
        shaderLocation: 0, /*position*/
        offset: 0,
        format: 'float32x3'
      }, {
        shaderLocation: 1, /*uv*/
        offset: 3 * 4,
        format: 'float32x2'
      }, {
        shaderLocation: 2, /*color*/
        offset: 5 * 4,
        format: 'float32x3'
      }, {
        shaderLocation: 3, /*opacity*/
        offset: 8 * 4,
        format: 'float32'
      }, {
        shaderLocation: 4, /*size*/
        offset: 9 * 4,
        format: 'float32'
      }, {
        shaderLocation: 5, /*angle*/
        offset: 10 * 4,
        format: 'float32'
      }, {
        shaderLocation: 6, /*visible*/
        offset: 11 * 4,
        format: 'float32'
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
    cullMode: 'none',
    frontFace: 'ccw'
  },
  depthStencil: {
    depthWriteEnabled: false,
    depthCompare: 'less',
    format: 'depth24plus'
  }
};

export const VERTEX_SHADER = `
@group(0) @binding(0) var<uniform> MVPC_MATRIX: mat4x4<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) FragUV: vec2<f32>,
  @location(1) Color: vec4<f32>,
  @location(2) Angle: f32
};

@vertex
fn main(
  @location(0) Position: vec3<f32>,
  @location(1) FragUV: vec2<f32>,
  @location(2) Color: vec3<f32>,
  @location(3) Opacity: f32,
  @location(4) Size: f32,
  @location(5) Angle: f32,
  @location(6) Visible: f32
) -> VertexOutput {
  var output : VertexOutput;

  if(Visible == 1)
  {
    output.Color = vec4(Color, Opacity);
  }
  else
  {
    output.Color = vec4(0.0, 0.0, 0.0, 0.0);
  }

  output.Position = MVPC_MATRIX * vec4(Position * Size, 1.0);
  output.FragUV = FragUV;
  output.Angle = Angle;
  return output;
}`;

export const FRAGMENT_SHADER = `
@group(1) @binding(0) var Sampler: sampler;
@group(1) @binding(1) var Texture: texture_2d<f32>;

@fragment
fn main(
  @builtin(position) Position: vec4<f32>,
  @location(0) FragUV: vec2<f32>
  @location(1) Color: vec4<f32>,
  @location(2) Angle: f32
) -> @location(0) vec4<f32> {
  var c = cos(Angle);
  var s = sin(Angle);
  var rotatedUV = vec2(
    c * (FragUV.x - 0.5) + s * (FragUV.y - 0.5) + 0.5,
    c * (FragUV.y - 0.5) - s * (FragUV.x - 0.5) + 0.5
  );

  return textureSample(Texture, Sampler, rotatedUV) * Color;
}`;
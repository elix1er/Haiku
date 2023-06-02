export const SHADER_VERTEX_ATTR_COUNT = 12;
export const SHADER_UNIFORM_ATTR_COUNT = 7;

const additiveBlend: GPUBlendState = {
  color: {
      srcFactor: "one",
      dstFactor: "one",
      operation: "add",
  },
  alpha: {
      srcFactor: "one",
      dstFactor: "one",
      operation: "add",
  }
};

const alphaBlend = {
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

export const PIPELINE_DESC: any = {
  label: 'Particles pipeline',
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
      }, {
        shaderLocation: 2, /*customColor*/
        offset: 5 * 4,
        format: 'float32x3'
      }, {
        shaderLocation: 3, /*customOpacity*/
        offset: 8 * 4,
        format: 'float32'
      }, {
        shaderLocation: 4, /*customSize*/
        offset: 9 * 4,
        format: 'float32'
      }, {
        shaderLocation: 5, /*customAngle*/
        offset: 10 * 4,
        format: 'float32'
      }, {
        shaderLocation: 6, /*customVisible*/
        offset: 11 * 4,
        format: 'float32'
      }]
    }]
  },
  fragment: {
    entryPoint: 'main',
    targets: [{
      format: navigator.gpu.getPreferredCanvasFormat(),
      blend: alphaBlend
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
@group(0) @binding(0) var<uniform> modelViewMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> projectionMatrix: mat4x4<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) PointSize: f32,
  @location(1) vColor : vec4<f32>,
  @location(2) vAngle: f32,
  @location(3) uv : vec2<f32>,
  @location(4) mvPosition : vec4<f32>
};

@vertex
fn main(
  @location(0) position : vec3<f32>,
  @location(1) uv : vec2<f32>,
  @location(2) customColor: vec3<f32>,
  @location(3) customOpacity: f32,
  @location(4) customSize: f32,
  @location(5) customAngle: f32,
  @location(6) customVisible: f32
) -> VertexOutput {

  var output : VertexOutput;
  
  if(customVisible > 0.5){  // true
    output.vColor = vec4( customColor, customOpacity ); //     set color associated to vertex; use later in fragment shader.
  }else{ // false
    output.vColor = vec4(0.0, 0.0, 0.0, 0.0); 		//     make particle invisible.
  }

  output.vAngle = customAngle;
  
  output.mvPosition = modelViewMatrix * vec4( position, 1.0 );
  output.PointSize = customSize * ( 100.0 / output.mvPosition.w );     // scale particles as objects in 3D space
  output.Position = projectionMatrix * output.mvPosition;
  output.uv = uv;
  return output;
}`;

export const FRAGMENT_SHADER = `

@group(0) @binding(2) var<uniform> useTex: vec4<f32>;
@group(0) @binding(3) var<uniform> POINT_LIGHT0: vec4<f32>;
@group(0) @binding(4) var<uniform> POINT_LIGHT0_COLOR: vec4<f32>;

@group(0) @binding(5) var<uniform> POINT_LIGHT1: vec4<f32>;
@group(0) @binding(6) var<uniform> POINT_LIGHT1_COLOR: vec4<f32>;

@group(0) @binding(7) var Sampler: sampler;
@group(0) @binding(8) var Texture: texture_2d<f32>;

@fragment
fn main(
  @builtin(position) Position: vec4<f32>,
  @location(0) PointSize: f32,
  @location(1) vColor : vec4<f32>,
  @location(2) vAngle: f32,
  @location(3) uv : vec2<f32>,
  @location(4) mvPosition : vec4<f32>
) -> @location(0) vec4<f32> {

  var pixel:vec3<f32>;
  var color= vec3(0.0, 0.0, 0.0);
  var texel= vec4(1.0, 1.0, 1.0, 1.0);

  if(useTex.r > 0.5){
    var c = cos(vAngle);
    var s = sin(vAngle);

    var rotatedUV = vec2(c * (uv.x - 0.5) + s * (uv.y - 0.5) + 0.5,
	                       c * (uv.y - 0.5) - s * (uv.x - 0.5) + 0.5);

    texel = textureSample(Texture, Sampler, uv);
    pixel = vColor.xyz * texel.xyz;
  }
  else
  {
    pixel = vColor.xyz;
  }
  
  return vec4(color, texel.a * vColor.a );
}`;
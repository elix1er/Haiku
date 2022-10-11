export const SHADER_VERTEX_ATTR_COUNT = 14;
export const SHADER_UNIFORM_ATTR_COUNT = 8;

export const PIPELINE_DESC: any = {
  label: 'Mesh pipeline',
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
        shaderLocation: 2, /*normal*/
        offset: 5 * 4,
        format: 'float32x3'
      }, {
        shaderLocation: 3, /*tangeant*/
        offset: 8 * 4,
        format: 'float32x3'
      }, {
        shaderLocation: 4, /*binormal*/
        offset: 11 * 4,
        format: 'float32x3'
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
@group(0) @binding(0) var<uniform> mvMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> pcMatrix: mat4x4<f32>;
@group(0) @binding(2) var<uniform> normMatrix: mat4x4<f32>;
@group(0) @binding(3) var<uniform> lightPos: vec3<f32>;
@group(0) @binding(4) var<uniform> ambiantColor: vec3<f32>;
@group(0) @binding(5) var<uniform> baseColor: vec4<f32>;
@group(0) @binding(6) var<uniform> specular: vec4<f32>;
@group(0) @binding(7) var<uniform> params: vec4<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) fragUV: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) normal: vec3<f32>,
  @location(3) tangeant: vec3<f32>,
  @location(4) binormal: vec3<f32>,
  @location(5) lightDir: vec3<f32>,
  @location(6) eyeDir: vec3<f32>
};

@vertex
fn main(
  @location(0) position: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) normal: vec3<f32>,
  @location(3) tangeant: vec3<f32>,
  @location(4) binormal: vec3<f32>
) -> VertexOutput {
  var output: VertexOutput;
  var myColor: vec3<f32>;
  var opacity: f32;
  var mvPosition = mvMatrix * position;
  output.Position = pcMatrix * mvPosition;

  myColor = baseColor.rgb;
  opacity = baseColor.w;

  /* diffuse texture */
  if(params[0] != 0.0)
  {
    output.fragUV = uv;
  }

  output.normal = normalize(normMatrix * vec4<f32>(normal.x, normal.y, normal.z, 0.0)).xyz;  
  output.eyeDir = normalize(mvPosition.xyz);

  /* lighting */
  if(params[1] != 0.0)
  {
    output.lightDir = normalize(lightPos.xyz - mvPosition.xyz);

    // normal map 
    if(params[2] != 0.0)
    {
      var t = normalize(normMatrix * vec4<f32>(tangeant.x, tangeant.y, tangeant.z, 0.0));
      var b = normalize(normMatrix * vec4<f32>(binormal.x, binormal.y, binormal.z, 0.0));
      output.tangeant = t.xyz;
      output.binormal = b.xyz;
    }
    else
    {
      var lightDot = max(0.0, dot(output.lightDir, output.normal));
      myColor *= lightDot;

      if (lightDot > 0.0)
      {
        var rvec = reflect(-output.lightDir, output.normal);
        var specularFac = pow(max(0.0, dot(output.eyeDir, rvec)), specular.a) * specular.rgb;
        myColor += specularFac;
      }
    }

    myColor += ambiantColor;
  }

  output.color = vec4<f32>(myColor.r, myColor.g, myColor.b , opacity);
  return output;
}`;

export const FRAGMENT_SHADER = `
@group(0) @binding(4) var<uniform> ambiantColor: vec3<f32>;
@group(0) @binding(5) var<uniform> baseColor: vec4<f32>;
@group(0) @binding(6) var<uniform> specular: vec4<f32>;
@group(0) @binding(7) var<uniform> params: vec4<f32>;

@group(1) @binding(0) var Sampler: sampler;
@group(1) @binding(1) var Texture: texture_2d<f32>;

@group(2) @binding(0) var NormSampler: sampler;
@group(2) @binding(1) var NormTexture: texture_2d<f32>;

@group(3) @binding(0) var EnvMapSampler: sampler;
@group(3) @binding(1) var EnvMapTexture: texture_cube<f32>;

@fragment
fn main(
  @location(0) fragUV: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) normal: vec3<f32>,
  @location(3) tangeant: vec3<f32>,
  @location(4) binormal: vec3<f32>,
  @location(5) lightDir: vec3<f32>,
  @location(6) eyeDir: vec3<f32>
) -> @location(0) vec4<f32> {
  var finalColor = color;

  /* diffuse texture */
  if(params[0] != 0.0)
  {
    var textureColor:vec4<f32> = (textureSample(Texture, Sampler, fragUV));
    finalColor *= textureColor;
  }

  /* normal map */
  if(params[2] != 0.0)
  {
    var pixelNormal:vec4<f32> = (textureSample(NormTexture, NormSampler, fragUV));
    var pnorm = normalize((pixelNormal.xyz - 0.5) * 2.0);

    // compute polygon space pixel lighting 
    var tangeantSpace = mat3x3<f32>(tangeant, binormal, normal);
    var newNormal = tangeantSpace * pnorm;

    // apply pixel lighting 
    var lightDot = dot(newNormal,  lightDir);
    var lcol = finalColor.rgb * max(0.0, lightDot);

    if (lightDot > 0.0)
    {
      var rvec = reflect(-lightDir, newNormal);
      var specularFac = pow(max(0.0,dot(eyeDir, rvec)), specular.a) * specular.rgb;
      lcol += specularFac;
    }

    lcol += ambiantColor;
    finalColor = vec4<f32>(lcol.r, lcol.g, lcol.b, finalColor.a );
  }

  /* env map */
  if(params[3] != 0.0)
  {
    var rvec = normalize(reflect(-eyeDir, normal));
    var envMapColor:vec4<f32> = (textureSample(EnvMapTexture, EnvMapSampler, vec3<f32>(rvec.x, rvec.y, rvec.z)));
    finalColor *= envMapColor;
  }

  return finalColor;
}`;
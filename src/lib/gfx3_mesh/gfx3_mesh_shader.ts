export const SHADER_VERTEX_ATTR_COUNT = 14;
export const SHADER_UNIFORM_ATTR_COUNT = 11;

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
        shaderLocation: 3, /*tangent*/
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
@group(0) @binding(0) var<uniform> MVPC_MATRIX: mat4x4<f32>;
@group(0) @binding(1) var<uniform> NORM_MATRIX: mat3x3<f32>;
@group(0) @binding(2) var<uniform> M_MATRIX: mat4x4<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) FragPos: vec3<f32>,
  @location(1) FragUV: vec2<f32>,
  @location(2) FragNormal: vec3<f32>,
  @location(3) FragTangent: vec3<f32>,
  @location(4) FragBinormal: vec3<f32>
};

@vertex
fn main(
  @location(0) position: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) normal: vec3<f32>,
  @location(3) tangent: vec3<f32>,
  @location(4) binormal: vec3<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.Position = MVPC_MATRIX * position;
  output.FragPos = vec4(M_MATRIX * position).xyz;
  output.FragUV = uv;
  output.FragNormal = NORM_MATRIX * normal;
  output.FragTangent = NORM_MATRIX * tangent;
  output.FragBinormal = NORM_MATRIX * binormal;
  return output;
}`;

export const FRAGMENT_SHADER = `
struct MaterialParams {
  OPACITY: f32,
  HAS_TEXTURE: f32,
  HAS_LIGHTNING: f32,
  HAS_NORMAL_MAP: f32,
  HAS_ENV_MAP: f32
}

@group(0) @binding(3)  var<uniform> CAMERA_POS: vec3<f32>;
@group(0) @binding(4)  var<uniform> POINT_LIGHT0: vec4<f32>;
@group(0) @binding(5)  var<uniform> POINT_LIGHT1: vec4<f32>;
@group(0) @binding(6)  var<uniform> DIR_LIGHT: vec4<f32>;
@group(0) @binding(7)  var<uniform> MAT_AMBIANT_COLOR: vec4<f32>;
@group(0) @binding(8)  var<uniform> MAT_DIFFUSE_COLOR: vec4<f32>;
@group(0) @binding(9)  var<uniform> MAT_SPECULAR: vec4<f32>;
@group(0) @binding(10) var<uniform> MAT_PARAMS: MaterialParams;

@group(1) @binding(0) var Sampler: sampler;
@group(1) @binding(1) var Texture: texture_2d<f32>;

@group(2) @binding(0) var NormSampler: sampler;
@group(2) @binding(1) var NormTexture: texture_2d<f32>;

@group(3) @binding(0) var EnvMapSampler: sampler;
@group(3) @binding(1) var EnvMapTexture: texture_cube<f32>;

@fragment
fn main(
  @builtin(position) Position: vec4<f32>,
  @location(0) FragPos: vec3<f32>,
  @location(1) FragUV: vec2<f32>,
  @location(2) FragNormal: vec3<f32>,
  @location(3) FragTangent: vec3<f32>,
  @location(4) FragBinormal: vec3<f32>
) -> @location(0) vec4<f32> {
  var outputColor: vec4<f32>;
  var normal: vec3<f32> = normalize(FragNormal);
  var textureColor = vec4<f32>(0, 0, 0, 0);
  
  if (MAT_PARAMS.HAS_TEXTURE == 1.0)
  {
    textureColor = textureSample(Texture, Sampler, FragUV);
  }

  if(MAT_PARAMS.HAS_NORMAL_MAP == 1.0)
  {
    var normalMap:vec4<f32> = textureSample(NormTexture, NormSampler, FragUV);
    normal = normalize(normalize(FragTangent) * normalMap.x + normalize(FragBinormal) * normalMap.y + normal * normalMap.z);
  }

  if (MAT_PARAMS.HAS_LIGHTNING == 0.0)
  {
    outputColor = textureColor;
  }
  else
  {
    if (DIR_LIGHT.w == 1.0)
    {
      outputColor += CalcDirLight(DIR_LIGHT.xyz, normal, FragPos, textureColor);
    }

    if (POINT_LIGHT0.w == 1.0)
    {
      outputColor += CalcPointLight(POINT_LIGHT0.xyz, normal, FragPos, textureColor);
    }

    if (POINT_LIGHT1.w == 1.0)
    {
      outputColor += CalcPointLight(POINT_LIGHT1.xyz, normal, FragPos, textureColor);
    }
  }

  if(MAT_PARAMS.HAS_ENV_MAP == 1.0)
  {
    var viewDir = normalize(CAMERA_POS - FragPos);
    var rvec = normalize(reflect(viewDir, normal));
    outputColor += textureSample(EnvMapTexture, EnvMapSampler, vec3<f32>(rvec.x, rvec.y, rvec.z)) * textureColor;
  }

  if (MAT_PARAMS.OPACITY != 1.0)
  {
    outputColor.a = MAT_PARAMS.OPACITY;
  }

  return outputColor;
}

// *****************************************************************************************************************
// UTILS
// *****************************************************************************************************************

fn CalcDirLight(lightDir: vec3<f32>, normal: vec3<f32>, fragPos: vec3<f32>, textureColor: vec4<f32>) -> vec4<f32>
{
    var ambientColor = MAT_AMBIANT_COLOR * textureColor;
    var diffuseColor: vec4<f32> = vec4(0.0, 0.0, 0.0, 1.0);
    var specularColor: vec4<f32> = vec4(0.0, 0.0, 0.0, 1.0);

    var reverseLightDir = normalize(-lightDir);
    var diffuseFactor = max(dot(normal, reverseLightDir), 0.0);

    if (diffuseFactor > 0.0)
    {
      diffuseColor = MAT_DIFFUSE_COLOR * diffuseFactor * textureColor;
      var reflectDir = reflect(-reverseLightDir, normal);
      var viewDir = normalize(CAMERA_POS - fragPos);
      var specularFactor = max(dot(viewDir, reflectDir), 0.0);
      if (specularFactor > 0.0) {
        specularColor = MAT_SPECULAR * pow(specularFactor, MAT_SPECULAR.a) * textureColor;
      }
    }

  return ambientColor + diffuseColor + specularColor;
}

fn CalcPointLight(lightPos: vec3<f32>, normal: vec3<f32>, fragPos: vec3<f32>, textureColor: vec4<f32>) -> vec4<f32>
{
  var ambientColor = MAT_AMBIANT_COLOR * textureColor;
  var diffuseColor: vec4<f32> = vec4(0.0, 0.0, 0.0, 1.0);
  var specularColor: vec4<f32> = vec4(0.0, 0.0, 0.0, 1.0);
  var reverseLightDir = normalize(lightPos - fragPos);
  var diffuseFactor = max(dot(normal, reverseLightDir), 0.0);

  if (diffuseFactor > 0.0)
  {
    diffuseColor = MAT_DIFFUSE_COLOR * diffuseFactor * textureColor;
    var reflectDir = reflect(-reverseLightDir, normal);
    var viewDir = normalize(CAMERA_POS - fragPos);
    var specularFactor = max(dot(viewDir, reflectDir), 0.0);
    if (specularFactor > 0.0) {
      specularColor = MAT_SPECULAR * pow(specularFactor, MAT_SPECULAR.a) * textureColor;
    }
  }

  return ambientColor + diffuseColor + specularColor;
}
`;
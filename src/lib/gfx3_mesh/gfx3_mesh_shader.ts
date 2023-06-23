export const SHADER_VERTEX_ATTR_COUNT = 14;

export const PIPELINE_DESC: any = {
  label: 'Mesh pipeline',
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
struct MeshMatrices {
  MVPC_MATRIX: mat4x4<f32>,
  M_MATRIX: mat4x4<f32>,
  NORM_MATRIX: mat3x3<f32>,
};

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) FragPos: vec3<f32>,
  @location(1) FragUV: vec2<f32>,
  @location(2) FragNormal: vec3<f32>,
  @location(3) FragTangent: vec3<f32>,
  @location(4) FragBinormal: vec3<f32>
};

@group(1) @binding(0) var<uniform> MESH_MATRICES: MeshMatrices;

@vertex
fn main(
  @location(0) Position: vec4<f32>,
  @location(1) TexUV: vec2<f32>,
  @location(2) Normal: vec3<f32>,
  @location(3) Tangent: vec3<f32>,
  @location(4) Binormal: vec3<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.Position = MESH_MATRICES.MVPC_MATRIX * Position;
  output.FragPos = vec4(MESH_MATRICES.M_MATRIX * Position).xyz;
  output.FragUV = TexUV;
  output.FragNormal = MESH_MATRICES.NORM_MATRIX * Normal;
  output.FragTangent = MESH_MATRICES.NORM_MATRIX * Tangent;
  output.FragBinormal = MESH_MATRICES.NORM_MATRIX * Binormal;
  return output;
}`;

export const FRAGMENT_SHADER = `
struct MaterialParams {
  OPACITY: f32,
  NORMAL_INTENSITY: f32,
  HAS_TEXTURE: f32,
  HAS_LIGHTNING: f32,
  HAS_NORMAL_MAP: f32,
  HAS_ENV_MAP: f32,
  HAS_SPECULARITY_MAP: f32
}

struct PointLight {
  INTENSITY: f32,
  POSITION: vec3<f32>,
  COLOR: vec3<f32>,
  ATTEN: vec3<f32>
}

struct DirectionnalLight {
  INTENSITY: f32,
  DIR: vec3<f32>,
  COLOR: vec3<f32>
}

@group(0) @binding(0) var<uniform> CAMERA_POS: vec3<f32>;
@group(0) @binding(1) var<uniform> POINT_LIGHT0: PointLight;
@group(0) @binding(2) var<uniform> POINT_LIGHT1: PointLight;
@group(0) @binding(3) var<uniform> DIR_LIGHT: DirectionnalLight;

@group(2) @binding(0) var<uniform> MAT_EMISSIVE_COLOR: vec3<f32>;
@group(2) @binding(1) var<uniform> MAT_AMBIANT_COLOR: vec3<f32>;
@group(2) @binding(2) var<uniform> MAT_DIFFUSE_COLOR: vec3<f32>;
@group(2) @binding(3) var<uniform> MAT_SPECULAR: vec4<f32>;
@group(2) @binding(4) var<uniform> MAT_PARAMS: MaterialParams;

@group(3) @binding(0) var Sampler: sampler;
@group(3) @binding(1) var Texture: texture_2d<f32>;
@group(3) @binding(2) var SpecularitySampler: sampler;
@group(3) @binding(3) var SpecularityTexture: texture_2d<f32>;
@group(3) @binding(4) var NormSampler: sampler;
@group(3) @binding(5) var NormTexture: texture_2d<f32>;
@group(3) @binding(6) var EnvMapSampler: sampler;
@group(3) @binding(7) var EnvMapTexture: texture_cube<f32>;

@fragment
fn main(
  @builtin(position) Position: vec4<f32>,
  @location(0) FragPos: vec3<f32>,
  @location(1) FragUV: vec2<f32>,
  @location(2) FragNormal: vec3<f32>,
  @location(3) FragTangent: vec3<f32>,
  @location(4) FragBinormal: vec3<f32>
) -> @location(0) vec4<f32> {
  var normal: vec3<f32> = normalize(FragNormal);
  var outputColor = vec4(0.0, 0.0, 0.0, 1.0);
  var texel = vec4(1.0, 1.0, 1.0, 1.0);

  if (MAT_PARAMS.HAS_TEXTURE == 1.0)
  {
    texel = textureSample(Texture, Sampler, FragUV);
  }

  if (MAT_PARAMS.HAS_NORMAL_MAP == 1.0)
  {
    var normalIntensity = vec4<f32>(MAT_PARAMS.NORMAL_INTENSITY, MAT_PARAMS.NORMAL_INTENSITY, 1, 1);
    var normalPixel = textureSample(NormTexture, NormSampler, FragUV) * normalIntensity;
    normal = normalize(normalize(FragTangent) * normalPixel.x + normalize(FragBinormal) * normalPixel.y + normal * normalPixel.z);
  }

  if (MAT_PARAMS.HAS_LIGHTNING == 1.0)
  {
    if (DIR_LIGHT.INTENSITY > 0.0)
    {
      outputColor += CalcDirLight(DIR_LIGHT.DIR, DIR_LIGHT.INTENSITY, DIR_LIGHT.COLOR, normal, FragPos, FragUV) * texel;
    }

    if (POINT_LIGHT0.INTENSITY > 0.0)
    {
      outputColor += CalcPointLight(POINT_LIGHT0.POSITION, POINT_LIGHT0.INTENSITY, POINT_LIGHT0.COLOR, POINT_LIGHT0.ATTEN, normal, FragPos, FragUV) * texel;
    }

    if (POINT_LIGHT1.INTENSITY > 0.0)
    {
      outputColor += CalcPointLight(POINT_LIGHT1.POSITION, POINT_LIGHT1.INTENSITY, POINT_LIGHT1.COLOR, POINT_LIGHT1.ATTEN, normal, FragPos, FragUV) * texel;
    }
  }
  else
  {
    outputColor = texel;
  }

  if (MAT_PARAMS.HAS_ENV_MAP == 1.0)
  {
    var viewDir = normalize(CAMERA_POS - FragPos);
    var rvec = normalize(reflect(viewDir, normal));
    outputColor += textureSample(EnvMapTexture, EnvMapSampler, vec3<f32>(rvec.x, rvec.y, rvec.z));
  }

  outputColor += vec4(MAT_EMISSIVE_COLOR, 1.0);
  return vec4(outputColor.rgb, texel.a * MAT_PARAMS.OPACITY);
}

// *****************************************************************************************************************
// CALC LIGHT INTERNAL
// *****************************************************************************************************************

fn CalcLightInternal(lightDir: vec3<f32>, lightColor: vec3<f32>, lightIntensity: f32, normal: vec3<f32>, fragPos: vec3<f32>, fragUV: vec2<f32>) -> vec4<f32>
{
  var ambientColor = lightColor * lightIntensity * MAT_AMBIANT_COLOR;
  var diffuseColor: vec3<f32> = vec3(0.0, 0.0, 0.0);
  var specularColor: vec3<f32> = vec3(0.0, 0.0, 0.0);
  var specularExponent = MAT_SPECULAR.a;
  var diffuseFactor = max(dot(normal, -lightDir), 0.0);

  if (MAT_PARAMS.HAS_SPECULARITY_MAP == 1.0)
  {
    specularExponent = MAT_SPECULAR.a * textureSample(SpecularityTexture, SpecularitySampler, fragUV).r;
  }

  if (diffuseFactor > 0.0)
  {
    diffuseColor = lightColor * lightIntensity * MAT_DIFFUSE_COLOR * diffuseFactor;
    if (specularExponent > 0.0)
    {
      var reflectDir = reflect(lightDir, normal);
      var viewDir = normalize(CAMERA_POS - fragPos);
      var specularFactor = max(dot(viewDir, reflectDir), 0.0);
      if (specularFactor > 0.0)
      {
        specularFactor = pow(specularFactor, specularExponent);
        specularColor = lightColor * lightIntensity * MAT_SPECULAR.rgb * specularFactor;
      }
    }
  }

  return vec4(ambientColor + diffuseColor + specularColor, 1.0);
}

// *****************************************************************************************************************
// CALC DIR LIGHT
// *****************************************************************************************************************

fn CalcDirLight(lightDir: vec3<f32>, lightIntensity: f32, lightColor: vec3<f32>, normal: vec3<f32>, fragPos: vec3<f32>, fragUV: vec2<f32>) -> vec4<f32>
{
  return CalcLightInternal(normalize(lightDir), lightColor, lightIntensity, normal, fragPos, fragUV);
}

// *****************************************************************************************************************
// CALC POINT LIGHT
// *****************************************************************************************************************

fn CalcPointLight(lightPos: vec3<f32>, lightIntensity: f32, lightColor: vec3<f32>, lightAttenuation: vec3<f32>, normal: vec3<f32>, fragPos: vec3<f32>, fragUV: vec2<f32>) -> vec4<f32>
{
  var lightDir = fragPos - lightPos;
  var distance = length(lightDir);
  lightDir = normalize(lightDir);

  var color = CalcLightInternal(lightDir, lightColor, lightIntensity, normal, fragPos, fragUV);
  var attenuation = lightAttenuation[0] + lightAttenuation[1] * distance + lightAttenuation[2] * distance * distance;
  return color / attenuation;
}
`;
export const SHADER_VERTEX_ATTR_COUNT = 14;
export const SHADER_UNIFORM_ATTR_COUNT = 1;

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
struct ModelMatrix {
  MVPC_MATRIX: mat4x4<f32>,
  M_MATRIX: mat4x4<f32>,
  NORM_MATRIX: mat3x3<f32>,
}

@group(1) @binding(0) var<uniform> modelMatrix: ModelMatrix;

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
  output.Position = modelMatrix.MVPC_MATRIX * position;
  output.FragPos = vec4(modelMatrix.M_MATRIX * position).xyz;
  output.FragUV = uv;
  output.FragNormal = modelMatrix.NORM_MATRIX * normal;
  output.FragTangent = modelMatrix.NORM_MATRIX * tangent;
  output.FragBinormal = modelMatrix.NORM_MATRIX * binormal;
  return output;
}`;

export const FRAGMENT_SHADER = `
struct MaterialParams {
  OPACITY: f32,
  HAS_TEXTURE: f32,
  HAS_LIGHTNING: f32,
  HAS_NORMAL_MAP: f32,
  HAS_ENV_MAP: f32,
  HAS_ROUGH_MAP: f32
}

@group(0) @binding(0) var<uniform> CAMERA_POS: vec3<f32>;
@group(0) @binding(1) var<uniform> POINT_LIGHT0: vec4<f32>;
@group(0) @binding(2) var<uniform> POINT_LIGHT0_COLOR: vec4<f32>;
@group(0) @binding(3) var<uniform> POINT_LIGHT1: vec4<f32>;
@group(0) @binding(4) var<uniform> POINT_LIGHT1_COLOR: vec4<f32>;
@group(0) @binding(5) var<uniform> DIR_LIGHT: vec4<f32>;
@group(0) @binding(6) var<uniform> DIR_LIGHT_COLOR: vec4<f32>;

@group(2) @binding(0) var<uniform> MAT_AMBIANT_COLOR: vec4<f32>;
@group(2) @binding(1) var<uniform> MAT_DIFFUSE_COLOR: vec4<f32>;
@group(2) @binding(2) var<uniform> MAT_SPECULAR: vec4<f32>;
@group(2) @binding(3) var<uniform> MAT_PARAMS: MaterialParams;

@group(2) @binding(4) var Sampler: sampler;
@group(2) @binding(5) var Texture: texture_2d<f32>;

@group(2) @binding(6) var RoughTexture: texture_2d<f32>;
@group(2) @binding(7) var NormTexture: texture_2d<f32>;

@group(2) @binding(8) var EnvMapSampler: sampler;
@group(2) @binding(9) var EnvMapTexture: texture_cube<f32>;

@group(2) @binding(10) var EnvMapSampler2: sampler;
@group(2) @binding(11) var EnvMapTexture2: texture_2d<f32>;

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
  var outputColor = vec3(0.0, 0.0, 0.0);
  var texel: vec4<f32>;
  var rougness : f32;

  if (MAT_PARAMS.HAS_TEXTURE > 0.5){
    texel = textureSample(Texture, Sampler, FragUV);
  }else{
    texel = vec4(1.0, 1.0, 1.0, 1.0);
  }

  if(MAT_PARAMS.HAS_NORMAL_MAP > 0.5)
  {
    var normalMap:vec4<f32> = textureSample(NormTexture, Sampler, FragUV);
    normal = normalize(normalize(FragTangent) * normalMap.x + normalize(FragBinormal) * normalMap.y + normal * normalMap.z);
  }

  if (MAT_PARAMS.HAS_ROUGH_MAP > 0.5){
    rougness = MAT_SPECULAR.a * textureSample(RoughTexture, Sampler, FragUV).r;
  }else{
    rougness = MAT_SPECULAR.a;
  }

  if (MAT_PARAMS.HAS_LIGHTNING < 0.5) {
    outputColor = texel.rgb * MAT_DIFFUSE_COLOR.rgb;
  }else{
    
    if (DIR_LIGHT.w > 0.5)
    {
      outputColor += CalcDirLight(DIR_LIGHT.xyz, DIR_LIGHT_COLOR, normal, FragPos, texel.rgb, rougness);
    }

    if (POINT_LIGHT0.w > 0.5)
    {
      outputColor += CalcPointLight(POINT_LIGHT0.xyz, POINT_LIGHT0_COLOR, normal, FragPos, texel.rgb, rougness);
    }

    if (POINT_LIGHT1.w > 0.5)
    {
      outputColor += CalcPointLight(POINT_LIGHT1.xyz, POINT_LIGHT1_COLOR,  normal, FragPos, texel.rgb, rougness);
    }

    outputColor +=  MAT_AMBIANT_COLOR.rgb;
  }
  
  
  if(MAT_PARAMS.HAS_ENV_MAP > 0.0)
  {
    var viewDir = normalize(CAMERA_POS - FragPos);
    var rvec = normalize(reflect(viewDir, normal));

    if(MAT_PARAMS.HAS_ENV_MAP > 1.5){

      var uv = vec2<f32>(atan2( rvec.z, rvec.x ) * 0.15915494309189535 + 0.5, asin( clamp( rvec.y, - 1.0, 1.0 ) ) * 0.3183098861837907 + 0.5);
      outputColor += textureSample(EnvMapTexture2, EnvMapSampler2, uv).rgb * 0.2;

    }else{
      outputColor += textureSample(EnvMapTexture, EnvMapSampler, vec3<f32>(rvec.x, rvec.y, rvec.z)).rgb;
    }
  }

  return vec4(outputColor, texel.a * MAT_DIFFUSE_COLOR.a * MAT_PARAMS.OPACITY);
}

// *****************************************************************************************************************
// UTILS
// *****************************************************************************************************************

fn CalcDirLight(lightDir: vec3<f32>, lightColor: vec4<f32>, normal: vec3<f32>, fragPos: vec3<f32>, texel: vec3<f32>, rougness: f32) -> vec3<f32>
{

    var diffuseColor: vec3<f32> = vec3(0.0, 0.0, 0.0);
    var specularColor: vec3<f32> = vec3(0.0, 0.0, 0.0);

    var reverseLightDir = normalize(-lightDir);
    var diffuseFactor = max(dot(normal, reverseLightDir), 0.0);

    if (diffuseFactor > 0.0)
    {
      diffuseColor = (MAT_DIFFUSE_COLOR.rgb * texel * lightColor.rgb) * diffuseFactor;
      if(rougness>0)
      {
        var reflectDir = reflect(-reverseLightDir, normal);
        var viewDir = normalize(CAMERA_POS - fragPos);
        var specularFactor = max(dot(viewDir, reflectDir), 0.0);
        if (specularFactor > 0.0) {
          specularColor = MAT_SPECULAR.rgb * pow(specularFactor, rougness) ;
        }
      }
    }

  return diffuseColor + specularColor;
}

fn CalcPointLight(lightPos: vec3<f32>, lightColor: vec4<f32>, normal: vec3<f32>, fragPos: vec3<f32>, texel: vec3<f32>, rougness: f32) -> vec3<f32>
{

  var diffuseColor: vec3<f32> = vec3(0.0, 0.0, 0.0);
  var specularColor: vec3<f32> = vec3(0.0, 0.0, 0.0);
  var reverseLightDir = normalize(lightPos - fragPos);
  var diffuseFactor = max(dot(normal, reverseLightDir), 0.0);
  var dist = distance(lightPos, fragPos);

  diffuseFactor *= 10.0/(dist*dist*lightColor.a)  ;

  if (diffuseFactor > 0.0)
  {
    diffuseColor =(MAT_DIFFUSE_COLOR.rgb * texel * lightColor.rgb) * diffuseFactor;
    
    if(rougness>0)
    {
      var reflectDir = reflect(-reverseLightDir, normal);
      var viewDir = normalize(CAMERA_POS - fragPos);
      var specularFactor = max(dot(viewDir, reflectDir), 0.0);
      if (specularFactor > 0.0) {
        specularColor = MAT_SPECULAR.rgb * pow(specularFactor, rougness);
      }
    }
  }
  return diffuseColor + specularColor;
}
`;
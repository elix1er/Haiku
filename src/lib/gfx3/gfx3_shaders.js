export const CREATE_MESH_SHADER_RES = async function (device) {
  let pipeline = await device.createRenderPipelineAsync({
    label: 'Basic Pipline',
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: `
        @binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;
        @binding(1) @group(0) var<uniform> lightPos :  vec3<f32>;
        @binding(2) @group(0) var<uniform> objMatrix : mat4x4<f32>;
        @binding(3) @group(0) var<uniform> normMatrix : mat4x4<f32>;

        @binding(4) @group(0) var<uniform> ambiantColor : vec3<f32>;
        @binding(5) @group(0) var<uniform> baseColor : vec4<f32>;
        @binding(6) @group(0) var<uniform> specular : vec4<f32>;
        @binding(7) @group(0) var<uniform> params : vec4<f32>;
        @binding(8) @group(0) var<uniform> camPos :  vec3<f32>;
     

        struct VertexOutput {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragUV : vec2<f32>,
          @location(1) color : vec4<f32>,
          @location(2) normal : vec3<f32>,
          @location(3) tangeant : vec3<f32>,
          @location(4) binormal : vec3<f32>,
          @location(5) lightDir : vec3<f32>,
          @location(6) eyeDir: vec3<f32>
        };

        @vertex
        fn main(
          @location(0) position : vec4<f32>,
          @location(1) uv : vec2<f32>,
          @location(2) normal : vec3<f32>,
          @location(3) tangeant : vec3<f32>,
          @location(4) binormal : vec3<f32>


          ) -> VertexOutput {
          var output : VertexOutput;
          var mycolor : vec3<f32>;
          var opacity : f32;

          var objPos = objMatrix * position;
          output.Position = mvpMatrix * objPos;

          mycolor = baseColor.rgb;
          opacity = baseColor.w;
         
          /* diffuse texture */
          if(params.x != 0.0)
          {
            output.fragUV = uv;
          }

          /* lighting */

          if(params.y != 0.0)
          {
            output.eyeDir = normalize(camPos - objPos.xyz);
            var nn = normMatrix * vec4<f32>(normal.x, normal.y, normal.z, 0.0);  
            output.normal = nn.xyz;
            output.lightDir = normalize(lightPos - objPos.xyz);

            // normal map 
            if(params.z != 0.0)
            {
              var t = normalize(normMatrix * vec4<f32>(tangeant.x, tangeant.y, tangeant.z, 0.0));
              var b = normalize(normMatrix * vec4<f32>(binormal.x, binormal.y, binormal.z, 0.0));
              output.tangeant = t.xyz;
              output.binormal = b.xyz;
            }
            else{
              var lightDot = max(0.0, dot(output.lightDir, output.normal ));
              mycolor *= lightDot;

              if (lightDot > 0.0)
              {
                var rvec = reflect(-output.lightDir, output.normal);
                var specularFac = pow(max(0.0,dot(output.eyeDir, rvec)), specular.a) * specular.rgb;
                mycolor += specularFac;
              }
            }
            mycolor += ambiantColor;
          }
          
          output.color = vec4<f32>(mycolor.x,mycolor.y, mycolor.z , opacity);
          
             
          return output;
        }`,
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 14 * 4, // 3 position 2 uv,
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
        },{
          label: 'normal',
          shaderLocation: 2,
          offset: 5 * 4,
          format: 'float32x3'
        }
        ,{
          label: 'tangeant',
          shaderLocation: 3,
          offset: 8 * 4,
          format: 'float32x3'
        },{
          label: 'binormal',
          shaderLocation: 4,
          offset: 11 * 4,
          format: 'float32x3'
        }
        ]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `

        @binding(4) @group(0) var<uniform> ambiantColor : vec3<f32>;
        @binding(5) @group(0) var<uniform> baseColor : vec4<f32>;
        @binding(6) @group(0) var<uniform> specular : vec4<f32>;
        @group(0) @binding(7)  var<uniform> params : vec4<f32>;

        

        @group(1) @binding(0) var Sampler: sampler;
        @group(1) @binding(1) var Texture: texture_2d<f32>;
       
        @group(2) @binding(0) var NormSampler: sampler;
        @group(2) @binding(1) var NormTexture: texture_2d<f32>;
              
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

          if(params[0] != 0.0)
          {
            var textureColor:vec4<f32> = (textureSample(Texture, Sampler, fragUV));
            finalColor *= textureColor;
          }

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
          
          return finalColor;
        }`
      }),
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
  });

  return pipeline;
}

export const CREATE_DEBUG_SHADER_RES = async function (device) {
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
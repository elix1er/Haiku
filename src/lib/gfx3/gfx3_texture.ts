export interface Gfx3Texture {
  gpuTexture: GPUTexture;
  gpuSampler: GPUSampler;
  bindGroup: GPUBindGroup | null;
};
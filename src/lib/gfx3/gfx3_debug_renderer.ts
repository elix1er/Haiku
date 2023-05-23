import { gfx3Manager, UniformGroupDataset } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { PIPELINE_DESC, VERTEX_SHADER, FRAGMENT_SHADER, SHADER_VERTEX_ATTR_COUNT } from './gfx3_debug_shader';

interface Command {
  vertices: Float32Array;
  vertexCount: number;
  matrix: mat4;
};

class Gfx3DebugRenderer {
  pipeline: GPURenderPipeline;
  device: GPUDevice;
  vertexBuffer: GPUBuffer;
  vertexCount: number;
  commands: Array<Command>;
  showDebug: boolean;
  cmdBuffer: UniformGroupDataset;

  constructor() {
    this.pipeline = gfx3Manager.loadPipeline('DEBUG_PIPELINE', VERTEX_SHADER, FRAGMENT_SHADER, PIPELINE_DESC);
    this.device = gfx3Manager.getDevice();
    this.vertexBuffer = this.device.createBuffer({ size: 0, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });

    this.vertexCount = 0;
    this.commands = [];
    this.showDebug = false;

    this.cmdBuffer = gfx3Manager.createUniformGroupDataset('DEBUG_PIPELINE', 0);
    this.cmdBuffer.addInput(0, UT.MAT4_SIZE, 'MVPC_MATRIX');
    this.cmdBuffer.allocate();
  }

  render(): void {
    if (!this.showDebug) {
      return;
    }

    const currentView = gfx3Manager.getCurrentView();
    const passEncoder = gfx3Manager.getPassEncoder();
    passEncoder.setPipeline(this.pipeline);

    let vertexBufferOffset = 0;
    this.vertexBuffer.destroy();
    this.vertexBuffer = this.device.createBuffer({ size: this.vertexCount * SHADER_VERTEX_ATTR_COUNT * 4, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });

    if (this.cmdBuffer.getSize() < this.commands.length) {
      this.cmdBuffer.allocate(this.commands.length);
    }

    const vpcMatrix = currentView.getViewProjectionClipMatrix();
    const mvpcMatrix = UT.MAT4_CREATE();

    this.cmdBuffer.beginWrite();

    for (let i = 0; i < this.commands.length; i++) {
      const cmd = this.commands[i];
      
      UT.MAT4_MULTIPLY(vpcMatrix, cmd.matrix, mvpcMatrix);
      this.cmdBuffer.write(0, mvpcMatrix);
      passEncoder.setBindGroup(0, this.cmdBuffer.getBindGroup(i));

      this.device.queue.writeBuffer(this.vertexBuffer, vertexBufferOffset, cmd.vertices);
      passEncoder.setVertexBuffer(0, this.vertexBuffer, vertexBufferOffset, cmd.vertices.byteLength);
      passEncoder.draw(cmd.vertexCount);
      vertexBufferOffset += cmd.vertices.byteLength;
    }

    this.cmdBuffer.endWrite();

    this.commands = [];
    this.vertexCount = 0;
  }

  drawVertices(vertices: Array<number>, vertexCount: number, matrix: mat4): void {
    this.commands.push({
      vertices: new Float32Array(vertices),
      vertexCount: vertexCount,
      matrix: matrix
    });

    this.vertexCount += vertexCount;
  }

  drawGrid(matrix: mat4, extend: number = 3, spacing: number = 1): void {
    let vertexCount: number = 0;
    const vertices: Array<number> = [];
    const nbCells = extend * 2;
    const gridSize = nbCells * spacing;
    const left = -gridSize * 0.5;
    const top = -gridSize * 0.5;

    for (let i = 0; i <= nbCells; i++) {
      const vLineFromX = left + (i * spacing);
      const vLineFromY = top;
      const vLineFromZ = 0;
      const vLineDestX = left + (i * spacing);
      const vLineDestY = top + gridSize;
      const vLineDestZ = 0;
      const hLineFromX = left;
      const hLineFromY = top + (i * spacing);
      const hLineFromZ = 0;
      const hLineDestX = left + gridSize;
      const hLineDestY = top + (i * spacing);
      const hLineDestZ = 0;
      vertices.push(vLineFromX, vLineFromY, vLineFromZ, 1, 1, 1);
      vertices.push(vLineDestX, vLineDestY, vLineDestZ, 1, 1, 1);
      vertices.push(hLineFromX, hLineFromY, hLineFromZ, 1, 1, 1);
      vertices.push(hLineDestX, hLineDestY, hLineDestZ, 1, 1, 1);
      vertexCount += 4;
    }

    this.commands.push({
      vertices: new Float32Array(vertices),
      vertexCount: vertexCount,
      matrix: matrix
    });

    this.vertexCount += vertexCount;
  }

  drawGizmo(matrix: mat4, size: number = 1): void {
    let vertexCount = 0;
    const vertices: Array<number> = [];
    const axes = [[1 * size, 0, 0], [0, 1 * size, 0], [0, 0, 1 * size]];
    const colors = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    for (let i = 0; i < axes.length; i++) {
      vertices.push(0, 0, 0, colors[i][0], colors[i][1], colors[i][2]);
      vertices.push(axes[i][0], axes[i][1], axes[i][2], colors[i][0], colors[i][1], colors[i][2]);
      vertexCount += 2;
    }

    this.commands.push({
      vertices: new Float32Array(vertices),
      vertexCount: vertexCount,
      matrix: matrix
    });

    this.vertexCount += vertexCount;
  }

  drawCircle(matrix: mat4, radius: number = 1, step: number = 4): void {
    let vertexCount = 0;
    const vertices: Array<number> = [];
    const angleStep = (Math.PI * 2) / step;

    for (let i = 0; i < step; i++) {
      const x1 = Math.cos(i * angleStep) * radius;
      const y1 = Math.sin(i * angleStep) * radius;
      const z1 = 0;
      const x2 = Math.cos((i + 1) * angleStep) * radius;
      const y2 = Math.sin((i + 1) * angleStep) * radius;
      const z2 = 0;

      vertices.push(x1, y1, z1, 1, 1, 1);
      vertices.push(x2, y2, z2, 1, 1, 1);
      vertexCount += 2;
    }

    this.commands.push({
      vertices: new Float32Array(vertices),
      vertexCount: vertexCount,
      matrix: matrix
    });

    this.vertexCount += vertexCount;
  }

  drawBoundingRect(matrix: mat4, min: vec2, max: vec2): void {
    let vertexCount = 0;
    const vertices: Array<number> = [];
    const a = [min[0], min[1], 0];
    const b = [min[0], max[1], 0];
    const c = [max[0], min[1], 0];
    const d = [max[0], max[1], 0];

    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertexCount += 2;

    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertexCount += 2;

    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertexCount += 2;

    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertexCount += 2;

    this.commands.push({
      vertices: new Float32Array(vertices),
      vertexCount: vertexCount,
      matrix: matrix
    });

    this.vertexCount += vertexCount;
  }

  drawSphere(matrix: mat4, radius: number = 1, step: number = 4): void {
    let vertexCount = 0;
    const vertices: Array<number> = [];
    const points: Array<[number, number, number]> = [];
    const angleStep = (Math.PI * 0.5) / step;

    for (let i = -step; i <= step; i++) {
      const r = Math.cos(i * angleStep) * radius;
      const y = Math.sin(i * angleStep) * radius;
      for (let j = 0; j <= step * 4; j++) {
        const z = Math.sin(j * angleStep) * r;
        const x = Math.cos(j * angleStep) * Math.cos(i * angleStep) * radius;
        points.push([x, y, z]);
      }
    }

    for (let i = -step; i <= step; i++) {
      for (let j = 0; j <= step * 4; j++) {
        const x = Math.cos(j * angleStep) * radius * Math.cos(i * angleStep);
        const y = Math.sin(j * angleStep) * radius;
        const z = Math.cos(j * angleStep) * radius * Math.sin(i * angleStep);
        points.push([x, y, z]);
      }
    }

    for (let i = 0; i < points.length - 1; i++) {
      vertices.push(points[i][0], points[i][1], points[i][2], 1, 1, 1);
      vertices.push(points[i + 1][0], points[i + 1][1], points[i + 1][2], 1, 1, 1);
      vertexCount += 2;
    }

    this.commands.push({
      vertices: new Float32Array(vertices),
      vertexCount: vertexCount,
      matrix: matrix
    });

    this.vertexCount += vertexCount;
  }

  drawBoundingBox(matrix: mat4, min: vec3, max: vec3): void {
    let vertexCount = 0;
    const vertices: Array<number> = [];
    const a = [min[0], min[1], min[2]];
    const b = [max[0], min[1], min[2]];
    const c = [max[0], max[1], min[2]];
    const d = [min[0], max[1], min[2]];
    const e = [min[0], max[1], max[2]];
    const f = [max[0], max[1], max[2]];
    const g = [max[0], min[1], max[2]];
    const h = [min[0], min[1], max[2]];

    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(h[0], h[1], h[2], 1, 1, 1);
    vertices.push(g[0], g[1], g[2], 1, 1, 1);
    vertexCount += 4;

    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(e[0], e[1], e[2], 1, 1, 1);
    vertices.push(f[0], f[1], f[2], 1, 1, 1);
    vertexCount += 4;

    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(h[0], h[1], h[2], 1, 1, 1);
    vertices.push(e[0], e[1], e[2], 1, 1, 1);
    vertexCount += 4;

    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(g[0], g[1], g[2], 1, 1, 1);
    vertices.push(f[0], f[1], f[2], 1, 1, 1);
    vertexCount += 4;

    vertices.push(d[0], d[1], d[2], 1, 1, 1);
    vertices.push(e[0], e[1], e[2], 1, 1, 1);
    vertices.push(c[0], c[1], c[2], 1, 1, 1);
    vertices.push(f[0], f[1], f[2], 1, 1, 1);
    vertexCount += 4;

    vertices.push(a[0], a[1], a[2], 1, 1, 1);
    vertices.push(h[0], h[1], h[2], 1, 1, 1);
    vertices.push(b[0], b[1], b[2], 1, 1, 1);
    vertices.push(g[0], g[1], g[2], 1, 1, 1);
    vertexCount += 4;

    this.commands.push({
      vertices: new Float32Array(vertices),
      vertexCount: vertexCount,
      matrix: matrix
    });

    this.vertexCount += vertexCount;
  }

  isShowDebug(): boolean {
    return this.showDebug;
  }

  setShowDebug(showDebug: boolean): void {
    this.showDebug = showDebug;
  }
}

export { Gfx3DebugRenderer };
export const gfx3DebugRenderer = new Gfx3DebugRenderer();
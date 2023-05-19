import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { UT } from '../../lib/core/utils';
import { Screen } from '../../lib/screen/screen';
import { Gfx3Camera } from '../../lib/gfx3_camera/gfx3_camera';
import { Gfx3Skybox } from '../../lib/gfx3_skybox/gfx3_skybox';
import { gfx3Manager } from '../../lib/gfx3/gfx3_manager';
import { gfx3MeshRenderer } from '../../lib/gfx3_mesh/gfx3_mesh_renderer';
import { SHADER_VERTEX_ATTR_COUNT } from '../../lib/gfx3_mesh/gfx3_mesh_shader';
import { Gfx3MeshShapeCylinder } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_cylinder';
import { Gfx3MeshShapeSphere } from '../../lib/gfx3_mesh_shape/gfx3_mesh_shape_sphere';
import { Gfx3Mesh } from '../../lib/gfx3_mesh/gfx3_mesh';
import { Gfx3Material } from '../../lib/gfx3_mesh/gfx3_mesh_material';
// ---------------------------------------------------------------------------------------

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const GRID_SPACE = 5;

class Transform {
  constructor(p = [0, 0, 0], a = [0, 0, 0], s = [0, 0, 0]) {
    this.p = p;
    this.a = a;
    this.s = s;
    this.m = UT.MAT4_CREATE();
  }
}

class MainScreen extends Screen {
  constructor() {
    super();
    this.camera = new Gfx3Camera(0);
    this.skybox = new Gfx3Skybox();
    this.isDragging = false;
    this.dragStartPosition = [0, 0];
    this.dragStartRotation = [0, 0];
    this.lightDir = [0, -1, 0.2];
    this.mode = 1;
    this.colFac = 0;
    this.obj = null;
    this.bigMesh = null;
    this.skySphere = null;
    this.transformations = [];
    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleMouseUpCb = this.handleMouseUp.bind(this);
    this.handleMouseMoveCb = this.handleMouseMove.bind(this);
    this.handleKeyUpCb = this.handleKeyUp.bind(this);

    const view = gfx3Manager.getView(0);
    view.setPerspectiveFar(700);
    view.setPerspectiveNear(0.1);

    this.camera.setPosition(0, 10, 0);
  }

  async onEnter() {
    this.skySphere = new Gfx3MeshShapeSphere(300, 8, 8, [1, 1]);
    this.skySphere.setMaterial(new Gfx3Material({
      texture: await gfx3TextureManager.loadTexture('./samples/perf/skybox.jpg')
    }));

    this.obj = new Gfx3MeshShapeCylinder(2, 5, 24, [1, 1]);
    this.obj.setMaterial(new Gfx3Material({
      lightning: true,
      texture: await gfx3TextureManager.loadTexture('./samples/perf/color-map.jpg'),
      normalMap: await gfx3TextureManager.loadTexture('./samples/perf/normal-map.png'),
      envMapEq: await gfx3TextureManager.loadTexture('./samples/perf/skybox.jpg'),
      specular: UT.VEC4_CREATE(1, 0, 0, 32)
    }));

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const mx = (x - GRID_WIDTH / 2) * GRID_SPACE;
        const my = (y - GRID_WIDTH / 2) * GRID_SPACE;

        const p = [mx, 0, my, 1];
        const a = [x, 0, y];
        const s = [1, 1, 1];

        this.transformations.push(new Transform(p, a, s));
      }
    }

    const bigMeshMatrices = this.transformations.map(t => UT.MAT4_TRANSFORM(t.p, t.a, t.s));
    this.bigMesh = DUPE(this.obj, bigMeshMatrices);

    document.addEventListener('mousedown', this.handleMouseDownCb);
    document.addEventListener('mouseup', this.handleMouseUpCb);
    document.addEventListener('mousemove', this.handleMouseMoveCb);
    document.addEventListener('keyup', this.handleKeyUpCb);
  }

  onExit() {
    document.removeEventListener('mousedown', this.handleMouseDownCb);
    document.removeEventListener('mouseup', this.handleMouseUpCb);
    document.removeEventListener('mousemove', this.handleMouseMoveCb);
  }

  update(ts) {
    this.obj.material.specular[0] = (Math.sin(this.colFac) + 1.0) * 0.5;
    this.obj.material.specular[1] = (Math.cos(this.colFac) + 1.0) * 0.5;
    this.obj.material.specular[2] = 0;

    this.obj.material.diffuse[0] = 0;
    this.obj.material.diffuse[1] = (Math.sin(this.colFac) + 1.0) * 0.5;
    this.obj.material.diffuse[2] = (Math.cos(this.colFac) + 1.0) * 0.5;
    this.obj.material.lightning = true;
    this.obj.material.changed = true;

    const r = Math.PI * 2 * 4 / this.transformations.length;
    let n = 0;

    for (const t of this.transformations) {
      t.a[0] += ts / 500.0;
      t.a[2] += ts / 1000.0;
      t.p[1] = Math.sin(n + this.colFac) * 3;
      UT.MAT4_TRANSFORM(t.p, t.a, t.s, t.m);
      n += r;
    }

    this.skySphere.setPosition(this.camera.getPositionX(), this.camera.getPositionY(), this.camera.getPositionZ());
    this.skySphere.update();

    this.colFac += ts * 0.003;
  }

  draw() {
    gfx3MeshRenderer.enableDirLight(this.lightDir);

    this.skySphere.draw();

    if (this.mode == 0) {
      this.bigMesh.draw();
    }
    else {
      for (const t of this.transformations) {
        gfx3MeshRenderer.drawMesh(this.obj, t.m);
      }
    }

    // document.getElementById('mode').innerHTML = this.mode;
    // document.getElementById('bind1').innerHTML = gfx3MeshRenderer.binds;
     document.getElementById('time').innerHTML = parseInt(gfx3Manager.lastRenderTime );
     document.getElementById('fps').innerHTML = (1000 / (gfx3Manager.lastRenderTime)).toFixed(2);
  }

  handleKeyUp(e) {
    if (e.code === 'KeyR') {
      this.mode = this.mode == 1 ? 0 : 1;
    }
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStartPosition[0] = e.clientX;
    this.dragStartPosition[1] = e.clientY;
    this.dragStartRotation[0] = this.camera.getRotationX();
    this.dragStartRotation[1] = this.camera.getRotationY();
  }

  handleMouseUp() {
    this.isDragging = false;
  }

  handleMouseMove(e) {
    if (!this.isDragging) {
      return;
    }

    let newRotationX = this.dragStartRotation[0] + ((e.clientY - this.dragStartPosition[1]) * 0.001);
    let newRotationY = this.dragStartRotation[1] + ((e.clientX - this.dragStartPosition[0]) * 0.001);
    this.camera.setRotation(newRotationX, newRotationY, 0);
  }
}

export { MainScreen };

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function DUPE(mesh, matrices) {
  const outMesh = new Gfx3Mesh();
  const vertices = mesh.getVertices();

  outMesh.beginVertices(mesh.getVertexCount() * matrices.length);

  for (const matrix of matrices) {
    for (let i = 0; i < vertices.length; i += SHADER_VERTEX_ATTR_COUNT) {
      const v = UT.MAT4_MULTIPLY_BY_VEC4(matrix, UT.VEC4_CREATE(vertices[i + 0], vertices[i + 1], vertices[i + 2], 1.0));
      outMesh.defineVertex(v[0], v[1], v[2], vertices[i + 3], vertices[i + 4], vertices[i + 5], vertices[i + 6], vertices[i + 7], vertices[i + 8], vertices[i + 9], vertices[i + 10], vertices[i + 11], vertices[i + 12], vertices[i + 13]);
    }
  }

  outMesh.endVertices();
  outMesh.setMaterial(mesh.getMaterial());
  return outMesh;
}
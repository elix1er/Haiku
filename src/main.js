import { gfx3Manager } from './lib/gfx3/gfx3_manager';
import { gfx3DebugRenderer } from './lib/gfx3/gfx3_debug_renderer';
import { gfx3MeshRenderer } from './lib/gfx3_mesh/gfx3_mesh_renderer';
import { gfx3SpriteRenderer } from './lib/gfx3_sprite/gfx3_sprite_renderer';
import { gfx3SkyboxRenderer } from './lib/gfx3_skybox/gfx3_skybox_renderer';
import { gfx3ParticlesRenderer } from './lib/gfx3_particules/gfx3_particles_renderer';   
import { gfx2Manager } from './lib/gfx2/gfx2_manager';
import { screenManager } from './lib/screen/screen_manager';
import { uiManager } from './lib/ui/ui_manager';
// ---------------------------------------------------------------------------------------
import { BootScreen } from './samples/boot/boot_screen';
// ---------------------------------------------------------------------------------------

class GameManager {
  constructor() {
    this.then = 0;
  }

  startup() {
    this.run(0);
  }

  run(timeStamp) {
    const ts = timeStamp - this.then;
    this.then = timeStamp;

    gfx2Manager.update(ts);
    uiManager.update(ts);
    screenManager.update(ts);

    gfx3Manager.beginDrawing(0);
    // gfx2Manager.beginDrawing();
    screenManager.draw();
    // gfx2Manager.endDrawing();
    gfx3Manager.endDrawing();

    gfx3Manager.beginRender();
    // gfx3SkyboxRenderer.render();
    gfx3DebugRenderer.render();
    gfx3MeshRenderer.render();
    gfx3SpriteRenderer.render();
    gfx3ParticlesRenderer.render();
    gfx3Manager.endRender();

    requestAnimationFrame(timeStamp => this.run(timeStamp));
  }
}

export const gameManager = new GameManager();
gameManager.startup();
screenManager.requestSetScreen(new BootScreen());
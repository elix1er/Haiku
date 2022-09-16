import { gfx3Manager } from './lib/gfx3/gfx3_manager.js';
import { screenManager } from './lib/screen/screen_manager.js';
// ---------------------------------------------------------------------------------------

class GameManager {
  constructor() {
    this.then = 0;
  }

  async startup() {
    await gfx3Manager.initialize();
    this.run(0);
  }

  run(timeStamp) {
    let ts = timeStamp - this.then;
    this.then = timeStamp;

    screenManager.update(ts);

    gfx3Manager.beginDrawing(0);
    screenManager.draw();
    gfx3Manager.endDrawing();

    requestAnimationFrame(timeStamp => this.run(timeStamp));
  }
}

export const gameManager = new GameManager();
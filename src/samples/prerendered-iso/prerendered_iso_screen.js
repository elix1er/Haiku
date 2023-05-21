import { gfx3DebugRenderer } from '../../lib/gfx3/gfx3_debug_renderer';
import { Screen } from '../../lib/screen/screen';
// ---------------------------------------------------------------------------------------
import { Room } from './room';

class PrerenderedIsoScreen extends Screen {
  constructor() {
    super();
    this.room = new Room();
  }

  async onEnter() {
    gfx3DebugRenderer.setShowDebug(true);
    await this.room.loadFromFile('./samples/prerendered-isometric/scene.room', 'Spawn0000');
  }

  update(ts) {
    this.room.update(ts);
  }

  draw() {
    this.room.draw();
  }
}

export { PrerenderedIsoScreen };
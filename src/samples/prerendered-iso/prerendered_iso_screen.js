import { Screen } from '../../lib/screen/screen';
// ---------------------------------------------------------------------------------------
import { Room } from './room';

class PrerenderedIsoScreen extends Screen {
  constructor() {
    super();
    this.room = new Room();
  }

  async onEnter() {
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
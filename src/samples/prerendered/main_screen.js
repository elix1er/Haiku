import { Screen } from '../../lib/screen/screen';
// ---------------------------------------------------------------------------------------
import { Room } from './room';

class MainScreen extends Screen {
  constructor() {
    super();
    this.room = new Room();
  }

  async onEnter() {
    await this.room.loadFromFile('./samples/prerendered/scene.room', 'Spawn0000');
  }

  update(ts) {
    this.room.update(ts);
  }

  draw() {
    this.room.draw();
  }
}

export { MainScreen };
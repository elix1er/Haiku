import { Screen } from './screen';

class ScreenManager {
  requests: Array<Function>;
  screens: Array<Screen>;

  constructor() {
    this.requests = [];
    this.screens = [];
  }

  update(ts: number): void {
    while (this.requests.length > 0) {
      let request = this.requests.pop()!;
      request();
    }

    for (let i = this.screens.length - 1; i >= 0; i--) {
      this.screens[i].update(ts);
      if (this.screens[i].isBlocking()) {
        return;
      }
    }
  }

  draw(): void {
    for (let i = this.screens.length - 1; i >= 0; i--) {
      this.screens[i].draw();
      if (this.screens[i].isBlocking()) {
        return;
      }
    }
  }

  requestPushScreen(newScreen: Screen, args: any = {}): void {
    this.requests.push(() => {
      if (this.screens.indexOf(newScreen) != -1) {
        throw new Error('ScreenManager::requestPushScreen(): You try to push an existing screen to the stack !');
      }

      let topScreen = this.screens[this.screens.length - 1];
      topScreen.onBringToBack(newScreen);

      let promise = newScreen.onEnter(args);
      promise.then(() => this.screens.push(newScreen));
    });
  }

  requestSetScreen(newScreen: Screen, args: any = {}): void {
    this.requests.push(() => {
      this.screens.forEach(screen => screen.onExit());
      this.screens = [];
      let promise = newScreen.onEnter(args);
      promise.then(() => this.screens.push(newScreen));
    });
  }

  requestPopScreen(): void {
    this.requests.push(() => {
      if (this.screens.length == 0) {
        throw new Error('ScreenManager::requestPopScreen: You try to pop an empty state stack !');
      }

      let topScreen = this.screens[this.screens.length - 1];
      topScreen.onExit();
      this.screens.pop();

      if (this.screens.length > 0) {
        let newTopScreen = this.screens[this.screens.length - 1];
        newTopScreen.onBringToFront(topScreen);
      }
    });
  }
}

export { ScreenManager };
export const screenManager = new ScreenManager();
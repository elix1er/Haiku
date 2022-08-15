class InputManager {
  constructor() {
    this.keymap = {};
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  isKeyDown(key) {
    return this.keymap[key];
  }

  handleKeyDown(e) {
    this.keymap[e.key] = true;
  }

  handleKeyUp(e) {
    this.keymap[e.key] = false;
  }
}

module.exports.inputManager = new InputManager();
class Screen {
  constructor(app) {
    this.app = app;
    this.blocking = true;
  }

  setBlocking(blocking) {
    this.blocking = blocking;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw() {
    // virtual method called during draw phase !
  }

  async onEnter(args) {
    // virtual method called during enter phase !
  }

  async onExit() {
    // virtual method called during exit phase !
  }

  onBringToFront() {
    // virtual method called when get the top state level !
  }

  onBringToBack() {
    // virtual method called when lost the top state level !
  }
}

module.exports.Screen = Screen;
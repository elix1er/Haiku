class Screen {
  blocking: boolean;

  constructor() {
    this.blocking = true;
  }

  setBlocking(blocking: boolean): void {
    this.blocking = blocking;
  }

  isBlocking(): boolean {
    return this.blocking;
  }

  update(ts: number): void {
    // virtual method called during update phase !
  }

  draw(): void {
    // virtual method called during draw phase !
  }

  async onEnter(args: any): Promise<void> {
    // virtual method called during enter phase !
  }

  onExit(): void {
    // virtual method called during exit phase !
  }

  onBringToFront(oldScreen: Screen): void {
    // virtual method called when get the top state level !
  }

  onBringToBack(newScreen: Screen): void {
    // virtual method called when lost the top state level !
  }
}

export { Screen };
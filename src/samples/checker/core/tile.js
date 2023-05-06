class Tile {
  constructor(piece = null, element = null) {
    this.piece = piece;
    this.element = element;
  }

  getPiece() {
    return this.piece;
  }

  setPiece(piece) {
    this.piece = piece;
  }

  getElement() {
    return this.element;
  }

  setElement(element) {
    this.element = element;
  }
}

export { Tile };
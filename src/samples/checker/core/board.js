import { COLOR } from './enums';
import { Pawn } from './piece';
import { Tile } from './tile';

class Board {
  constructor() {
    this.rows = 10;
    this.cols = 10;
    this.tiles = [];
    this.mustCapture = true;

    for (let y = 0; y < this.rows; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.cols; x++) {
        if (y < 4 && (x + y) % 2) {
          this.tiles[y][x] = new Tile(new Pawn(COLOR.BLACK));
        }
        else if (y > 5 && (x + y) % 2) {
          this.tiles[y][x] = new Tile(new Pawn(COLOR.WHITE));
        }
        else {
          this.tiles[y][x] = new Tile();
        }
      }
    }
  }

  getRows() {
    return this.rows;
  }

  getCols() {
    return this.cols;
  }

  getTile(coord) {
    return this.tiles[coord[1]][coord[0]];
  }

  getPiece(coord) {
    return this.tiles[coord[1]][coord[0]].getPiece();
  }

  isValidCoord(coord) {
    return coord[0] < this.cols && coord[0] >= 0 && coord[1] < this.rows && coord[1] >= 0;
  }

  findPossiblePoints(coord, onlyChainable = false) {
    let possiblePoints = [];
    let piece = this.tiles[coord[1]][coord[0]].getPiece();

    for (let move of piece.getMoves()) {
      if (onlyChainable && !move.isChainable()) {
        continue;
      }

      let numCapture = 0;
      let lastEncounterPiece = null;

      for (let vector of move.getPath()) {
        let x = coord[0] + vector[0];
        let y = coord[1] + vector[1];
        if (!this.isValidCoord([x, y])) {
          break;
        }

        let encounterPiece = this.tiles[y][x].getPiece();
        let encounterElement = this.tiles[y][x].getElement();

        let isBlockedByElement = encounterElement && encounterElement != piece.getElement();
        let isBlockedByCollate = encounterPiece && encounterPiece.getColor() != piece.getColor() && lastEncounterPiece && lastEncounterPiece.getColor() != piece.getColor() && !move.isCollateCapturable();
        let isBlockedByAlly = encounterPiece && encounterPiece.getColor() == piece.getColor();
        if (isBlockedByElement || isBlockedByCollate || isBlockedByAlly) {
          break;
        }

        if (encounterPiece && encounterPiece.getColor() != piece.getColor()) {
          numCapture++;
        }

        if (!encounterPiece && move.getNumCapture() == numCapture) {
          possiblePoints.push({ x, y, mustCapture: move.isForceCapture() });
        }

        lastEncounterPiece = encounterPiece;
      }
    }

    let mustCapture = possiblePoints.find(p => p.mustCapture) ? true : false;
    return possiblePoints.filter(p => mustCapture == p.mustCapture);
  }

  findMovableCoords(color) {
    let mustCaptureCoords = [];
    let otherCoords = [];

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let piece = this.tiles[y][x].getPiece();
        if (!piece) {
          continue;
        }

        if (piece.getColor() != color) {
          continue;
        }

        let points = this.findPossiblePoints([x, y]);
        if (points.length == 0) {
          continue;
        }

        if (points.find(p => p.mustCapture)) {
          mustCaptureCoords.push([x, y]);
        }
        else {
          otherCoords.push([x, y]);
        }
      }
    }

    if (this.mustCapture && mustCaptureCoords.length > 0) {
      return mustCaptureCoords;
    }

    return [...otherCoords, ...mustCaptureCoords];
  }
}

export { Board };
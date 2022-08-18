let { eventManager } = require('../core/event_manager');
let { UIWidget } = require('./ui_widget');

let GRID_WIDTH = 10;
let GRID_HEIGHT = 8;

class UIKeyboard extends UIWidget {
  constructor() {
    super({
      className: 'UIKeyboard',
      template: `
      <div class="UIKeyboard-value js-value"></div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="A">A</button>
        <button class="UIKeyboard-row-item js-item" data-char="B">B</button>
        <button class="UIKeyboard-row-item js-item" data-char="C">C</button>
        <button class="UIKeyboard-row-item js-item" data-char="D">D</button>
        <button class="UIKeyboard-row-item js-item" data-char="E">E</button>
        <button class="UIKeyboard-row-item js-item" data-char="F">F</button>
        <button class="UIKeyboard-row-item js-item" data-char="G">G</button>
        <button class="UIKeyboard-row-item js-item" data-char="H">H</button>
        <button class="UIKeyboard-row-item js-item" data-char="I">I</button>
        <button class="UIKeyboard-row-item js-item" data-char="J">J</button>
      </div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="K">K</button>
        <button class="UIKeyboard-row-item js-item" data-char="L">L</button>
        <button class="UIKeyboard-row-item js-item" data-char="M">M</button>
        <button class="UIKeyboard-row-item js-item" data-char="N">N</button>
        <button class="UIKeyboard-row-item js-item" data-char="O">O</button>
        <button class="UIKeyboard-row-item js-item" data-char="P">P</button>
        <button class="UIKeyboard-row-item js-item" data-char="Q">Q</button>
        <button class="UIKeyboard-row-item js-item" data-char="R">R</button>
        <button class="UIKeyboard-row-item js-item" data-char="S">S</button>
        <button class="UIKeyboard-row-item js-item" data-char="T">T</button>
      </div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="U">U</button>
        <button class="UIKeyboard-row-item js-item" data-char="V">V</button>
        <button class="UIKeyboard-row-item js-item" data-char="W">W</button>
        <button class="UIKeyboard-row-item js-item" data-char="X">X</button>
        <button class="UIKeyboard-row-item js-item" data-char="Y">Y</button>
        <button class="UIKeyboard-row-item js-item" data-char="Z">Z</button>
        <button class="UIKeyboard-row-item js-item" data-char="!">!</button>
        <button class="UIKeyboard-row-item js-item" data-char="?">?</button>
        <button class="UIKeyboard-row-item js-item" data-char="$">$</button>
        <button class="UIKeyboard-row-item js-item" data-char="#">#</button>
      </div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="a">a</button>
        <button class="UIKeyboard-row-item js-item" data-char="b">b</button>
        <button class="UIKeyboard-row-item js-item" data-char="c">c</button>
        <button class="UIKeyboard-row-item js-item" data-char="d">d</button>
        <button class="UIKeyboard-row-item js-item" data-char="e">e</button>
        <button class="UIKeyboard-row-item js-item" data-char="f">f</button>
        <button class="UIKeyboard-row-item js-item" data-char="g">g</button>
        <button class="UIKeyboard-row-item js-item" data-char="h">h</button>
        <button class="UIKeyboard-row-item js-item" data-char="i">i</button>
        <button class="UIKeyboard-row-item js-item" data-char="j">j</button>
      </div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="k">k</button>
        <button class="UIKeyboard-row-item js-item" data-char="l">l</button>
        <button class="UIKeyboard-row-item js-item" data-char="m">m</button>
        <button class="UIKeyboard-row-item js-item" data-char="n">n</button>
        <button class="UIKeyboard-row-item js-item" data-char="o">o</button>
        <button class="UIKeyboard-row-item js-item" data-char="p">p</button>
        <button class="UIKeyboard-row-item js-item" data-char="q">q</button>
        <button class="UIKeyboard-row-item js-item" data-char="r">r</button>
        <button class="UIKeyboard-row-item js-item" data-char="s">s</button>
        <button class="UIKeyboard-row-item js-item" data-char="t">t</button>
      </div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="u">u</button>
        <button class="UIKeyboard-row-item js-item" data-char="v">v</button>
        <button class="UIKeyboard-row-item js-item" data-char="w">w</button>
        <button class="UIKeyboard-row-item js-item" data-char="x">x</button>
        <button class="UIKeyboard-row-item js-item" data-char="y">y</button>
        <button class="UIKeyboard-row-item js-item" data-char="z">z</button>
        <button class="UIKeyboard-row-item js-item" data-char="=">=</button>
        <button class="UIKeyboard-row-item js-item" data-char="-">-</button>
        <button class="UIKeyboard-row-item js-item" data-char="+">+</button>
        <button class="UIKeyboard-row-item js-item" data-char="%">%</button>
      </div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="0">0</button>
        <button class="UIKeyboard-row-item js-item" data-char="1">1</button>
        <button class="UIKeyboard-row-item js-item" data-char="2">2</button>
        <button class="UIKeyboard-row-item js-item" data-char="3">3</button>
        <button class="UIKeyboard-row-item js-item" data-char="4">4</button>
        <button class="UIKeyboard-row-item js-item" data-char="5">5</button>
        <button class="UIKeyboard-row-item js-item" data-char="6">6</button>
        <button class="UIKeyboard-row-item js-item" data-char="7">7</button>
        <button class="UIKeyboard-row-item js-item" data-char="8">8</button>
        <button class="UIKeyboard-row-item js-item" data-char="9">9</button>
      </div>
      <div class="UIKeyboard-row">
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="">&nbsp;</button>
        <button class="UIKeyboard-row-item js-item" data-char="RETURN">&#9166;</button>
        <button class="UIKeyboard-row-item js-item" data-char="ENTER">x</button>
      </div>`
    });

    this.value = '';
    this.row = 0;
    this.column = 0;
  }

  focus() {
    let items = this.node.querySelectorAll('.js-item');
    let item = items[this.row * GRID_WIDTH + this.column];  
    item.classList.add('focused');
    super.focus();
  }

  unfocus() {
    let items = this.node.querySelectorAll('.js-item');
    let item = items[this.row * GRID_WIDTH + this.column];
    item.classList.remove('focused');
    super.unfocus();
  }

  setValue(value) {
    if (value == this.value) {
      return;
    }

    this.node.querySelector('.js-value').textContent = value;
    this.value = value;
  }

  moveCursor(direction) {
    let items = this.node.querySelectorAll('.js-item');
    items.forEach(item => item.classList.remove('focused'));

    if (direction == 'UP') {
      this.row = (this.row - 1) < 0 ? GRID_HEIGHT - 1 : this.row - 1;
    }
    else if (direction == 'RIGHT') {
      this.column = (this.column + 1) > GRID_WIDTH - 1 ? 0 : this.column + 1;
    }
    else if (direction == 'DOWN') {
      this.row = (this.row + 1) > GRID_HEIGHT - 1 ? 0 : this.row + 1;
    }
    else if (direction == 'LEFT') {
      this.column = (this.column - 1) < 0 ? GRID_WIDTH - 1 : this.column - 1;
    }

    items[this.row * GRID_WIDTH + this.column].classList.add('focused');
  }

  onKeyDown(e) {
    if (e.key == 'ArrowUp') {
      this.moveCursor('UP');
    }
    else if (e.key == 'ArrowRight') {
      this.moveCursor('RIGHT');
    }
    else if (e.key == 'ArrowDown') {
      this.moveCursor('DOWN');
    }
    else if (e.key == 'ArrowLeft') {
      this.moveCursor('LEFT');
    }
    else if (e.key == 'Enter') {
      let items = this.node.querySelectorAll('.js-item');
      let item = items[this.row * GRID_WIDTH + this.column];

      if (item.dataset.char == 'ENTER') {
        eventManager.emit(this, 'E_VALIDATE', { value: this.value });
      }
      else if (item.dataset.char == 'RETURN') {
        this.value = this.value.substr(0, this.value.length - 1);
        this.node.querySelector('.js-value').textContent = this.value;
      }
      else {
        this.value += item.dataset.char;
        this.node.querySelector('.js-value').textContent = this.value;  
      }
    }
  }
}

module.exports.UIKeyboard = UIKeyboard;
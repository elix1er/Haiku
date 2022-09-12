let { eventManager } = require('../core/event_manager');

class Pad {
  constructor() {
    this.index = '';
    this.id = '';
    this.nButtons = 0;
    this.nAxes = 0;
    this.pressed = [];
  }
}

class Action {
  constructor() {
    this.id = '';
    this.inputSource = '';
    this.eventType = '';
    this.eventKey = '';
  }
}

let GamePadKeyMapping = { // standard mapping https://w3c.github.io/gamepad/#remapping
  padTop: 12,
  padBottom: 13,
  padLeft: 14,
  padRight: 15,
  btnSelect: 8
};

class InputManager {
  constructor() {
    this.keymap = {};
    this.actionmap = {};
    this.actionRegister = [];
    this.pads = [];
    this.padsInterval = null;

    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('gamepadconnected', (e) => this.handleGamePadConnected(e));
    window.addEventListener('gamepaddisconnected', (e) => this.handleGamePadDisconnected(e));

    this.addAction('keyboard', 'down', 'Enter', 'OK');
    this.addAction('keyboard', 'down', 'Escape', 'BACK');
    this.addAction('keyboard', 'down', ' ', 'SELECT');
    this.addAction('keyboard', 'down', 'ArrowLeft', 'LEFT');
    this.addAction('keyboard', 'down', 'ArrowRight', 'RIGHT');
    this.addAction('keyboard', 'down', 'ArrowUp', 'UP');
    this.addAction('keyboard', 'down', 'ArrowDown', 'DOWN');

    this.addAction('gamepad0', 'down', 0, 'OK');
    this.addAction('gamepad0', 'down', 1, 'BACK');
    this.addAction('gamepad0', 'down', 'btnSelect', 'SELECT');
    this.addAction('gamepad0', 'down', 'padLeft', 'LEFT');
    this.addAction('gamepad0', 'down', 'padRight', 'RIGHT');
    this.addAction('gamepad0', 'down', 'padTop', 'UP');
    this.addAction('gamepad0', 'down', 'padBottom', 'DOWN');
  }

  getPad(index) {
    return this.pads.find(p => p.index == index);
  }

  addPad(pad) {
    this.pads.push(pad);
    if (this.padsInterval === null) {
      this.padsInterval = setInterval(() => this.$updatePadsStatus(), 50);
    }
  }

  removePad(id) {
    this.pads.filter(p => p.id != id);
    if (this.pads.length <= 0) {
      clearInterval(this.padsInterval);
      this.padsInterval = null;
    }
  }

  addAction(inputSource, eventType, eventKey, actionId) {
    let found = this.actionRegister.find(a => a.id == actionId);
    if (found) {
      return;
    }

    let action = new Action();
    action.id = actionId;
    action.inputSource = inputSource;
    action.eventType = eventType;
    action.eventKey = inputSource.startsWith('gamepad') ? GamePadKeyMapping[eventKey] : eventKey;
    this.actionRegister.push(action);
  }

  findActionIds(inputSource, eventType, eventKey) {
    let actionIds = []
    for (let action of this.actionRegister) {
      if (action.inputSource == inputSource && action.eventType == eventType && action.eventKey == eventKey) {
        actionIds.push(action.id);
      }
    }

    return actionIds;
  }

  isActiveAction(actionId) {
    return this.actionmap[actionId];
  }

  handleGamePadDisconnected(e) {
    this.removeGamePad(e.gamepad.id);
  }

  handleGamePadConnected(e) {
    let pad = new Pad();
    pad.index = e.gamepad.index;
    pad.id = e.gamepad.id;
    pad.nButtons = e.gamepad.buttons.length;
    pad.nAxes = e.gamepad.axes.length;

    for (let i = 0; i < e.gamepad.buttons.length; i++) {
      pad.pressed[i] = e.gamepad.buttons[i].pressed;
    }

    this.addGamePad(gamePad);
  }

  handleKeyDown(e) {
    if (!this.keymap[e.key]) {
      for (let actionId of this.findActionIds('keyboard', 'down', e.key)) {
        eventManager.emit(this, 'E_ACTION_ONCE', { actionId: actionId });
        this.actionmap[actionId] = true;
      }
    }

    for (let actionId of this.findActionIds('keyboard', 'down', e.key)) {
      eventManager.emit(this, 'E_ACTION', { actionId: actionId });
      this.actionmap[actionId] = true;
    }

    this.keymap[e.key] = true;
  }

  handleKeyUp(e) {
    for (let actionId of this.findActionIds('keyboard', 'down', e.key)) {
      eventManager.emit(this, 'E_ACTION_RELEASED', { actionId: actionId });
      this.actionmap[actionId] = false;
    }

    this.keymap[e.key] = false;
  }

  $updatePadsStatus() {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

    for (let i = 0; i < gamepads.length; i++) {
      if (!gamepads[i]) {
        continue;
      }

      let pad = this.getPad(gamepads[i].index);
      if (pad != null) {
        for (let n = 0; n < gamepads[i].buttons.length; n++) {
          if (gamepads[i].buttons[n].pressed != pad.pressed[n]) {
            for (let actionId of this.findActionIds('gamepad' + gamepads[i].index, pad.pressed[n] ? 'up' : 'down', n)) {
              eventManager.emit(this, 'E_ACTION', { actionId: actionId });
              this.actionmap[actionId] = gamepads[i].buttons[n].pressed;
            }

            this.keymap['gamepad' + gamepads[i].index + '-' + n] = gamepads[i].buttons[n].pressed;
            pad.pressed[n] = gamepads[i].buttons[n].pressed;
          }
        }
      }
    }
  }
}

module.exports.inputManager = new InputManager();
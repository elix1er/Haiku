let { eventManager } = require('./lib/core/event_manager');
let { uiManager } = require('./lib/ui/ui_manager');
let { gfx3TextureManager } = require('./lib/gfx3/gfx3_texture_manager');
let { Utils } = require('./lib/core/utils');
let { Gfx3JSM } = require('./lib/gfx3_jsm/gfx3_jsm');
let { Gfx3JWM } = require('./lib/gfx3_jwm/gfx3_jwm');
let { ScriptMachine } = require('./lib/script/script_machine');
let { UIBubble } = require('./lib/ui_bubble/ui_bubble');
// ---------------------------------------------------------------------------------------
let { Spawn } = require('./spawn');
let { Model } = require('./model');
let { Trigger } = require('./trigger');
let { Controller } = require('./controller');
let { Camera } = require('./camera');
// ---------------------------------------------------------------------------------------

class Room {
  constructor() {
    this.name = '';
    this.description = '';
    this.map = new Gfx3JSM();
    this.walkmesh = new Gfx3JWM();
    this.controller = new Controller();
    this.camera = new Camera();
    this.scriptMachine = new ScriptMachine();
    this.spawns = [];
    this.models = [];
    this.triggers = [];
    this.running = true;

    this.scriptMachine.registerCommand('LOAD_ROOM', Utils.BIND(this.$loadRoom, this));
    this.scriptMachine.registerCommand('CONTINUE', Utils.BIND(this.$continue, this));
    this.scriptMachine.registerCommand('STOP', Utils.BIND(this.$stop, this));
    this.scriptMachine.registerCommand('UI_CREATE_DIALOG', Utils.BIND(this.$uiCreateDialog, this));
    this.scriptMachine.registerCommand('MODEL_PLAY_ANIMATION', Utils.BIND(this.$modelPlayAnimation, this));
  }

  async loadFromFile(path, spawnName) {
    let response = await fetch(path);
    let json = await response.json();

    this.name = json['Name'];
    this.description = json['Description'];

    this.map = new Gfx3JSM();
    await this.map.loadFromFile(json['MapFile']);
    this.map.setTexture(await gfx3TextureManager.loadTexture(json['MapTextureFile']));

    this.walkmesh = new Gfx3JWM();
    await this.walkmesh.loadFromFile(json['WalkmeshFile']);

    this.controller = new Controller();
    await this.controller.loadFromData(json['Controller']);

    this.camera = new Camera();
    await this.camera.loadFromData(json['Camera']);
    this.camera.setTargetDrawable(this.controller);

    this.spawns = [];
    for (let obj of json['Spawns']) {
      let spawn = new Spawn();
      await spawn.loadFromData(obj);
      this.spawns.push(spawn);
    }

    this.models = [];
    for (let obj of json['Models']) {
      let model = new Model();
      await model.loadFromData(obj);
      this.models.push(model);
    }

    this.triggers = [];
    for (let obj of json['Triggers']) {
      let trigger = new Trigger();
      await trigger.loadFromData(obj);
      this.triggers.push(trigger);
    }

    let spawn = this.spawns.find(spawn => spawn.getName() == spawnName);
    this.controller.setPosition(spawn.getPositionX(), spawn.getPositionY(), spawn.getPositionZ());
    this.controller.setRotation(0, Utils.VEC2_ANGLE(spawn.getDirection()), 0);
    this.walkmesh.addWalker('CONTROLLER', this.controller.getPositionX(), this.controller.getPositionZ(), this.controller.getRadius());

    await this.scriptMachine.loadFromFile(json['ScriptFile']);
    this.scriptMachine.jump('ON_INIT');
    this.scriptMachine.setEnabled(true);

    eventManager.subscribe(this.controller, 'E_ACTION', this, this.handleControllerAction);
    eventManager.subscribe(this.controller, 'E_MOVED', this, this.handleControllerMoved);
  }

  handleKeyDownOnce(e) {
    this.controller.handleKeyDownOnce(e);
  }

  update(ts) {
    this.map.update(ts);
    this.walkmesh.update(ts);
    this.controller.update(ts);
    this.camera.update(ts);
    this.scriptMachine.update(ts);

    for (let spawn of this.spawns) {
      spawn.update(ts);
    }

    for (let model of this.models) {
      model.update(ts);
    }

    for (let trigger of this.triggers) {
      trigger.update(ts);
    }
  }

  draw() {
    this.map.draw();
    this.walkmesh.draw();
    this.controller.draw();

    for (let spawn of this.spawns) {
      spawn.draw();
    }

    for (let model of this.models) {
      model.draw();
    }

    for (let trigger of this.triggers) {
      trigger.draw();
    }
  }

  handleControllerAction({ handPositionX, handPositionY, handPositionZ }) {
    for (let trigger of this.triggers) {
      if (Utils.VEC3_DISTANCE(trigger.getPosition(), this.controller.getPosition()) <= this.controller.getRadius() + trigger.getRadius()) {
        if (trigger.getOnActionBlockId()) {
          this.scriptMachine.jump(trigger.getOnActionBlockId());
          return;
        }
      }
    }

    for (let model of this.models) {
      if (Utils.VEC3_DISTANCE(model.getPosition(), [handPositionX, handPositionY, handPositionZ]) <= model.getRadius()) {
        if (model.getOnActionBlockId()) {
          this.scriptMachine.jump(model.getOnActionBlockId());
          return;
        }
      }
    }
  }

  handleControllerMoved({ moveX, moveZ }) {
    for (let other of this.models) {
      let delta = Utils.VEC3_SUBSTRACT(this.controller.getPosition(), other.getPosition());
      let distance = Utils.VEC3_LENGTH(delta);
      let distanceMin = this.controller.getRadius() + other.getRadius();
      if (distance < distanceMin) {
        let c = Math.PI * 2 - (Math.PI * 2 - Math.atan2(delta[2], delta[0]));
        moveX += Math.cos(c) * (distanceMin - distance);
        moveZ += Math.sin(c) * (distanceMin - distance);
        break;
      }
    }

    let walker = this.walkmesh.moveWalker('CONTROLLER', moveX, moveZ);
    this.controller.setPosition(walker.x, walker.y, walker.z);

    for (let trigger of this.triggers) {
      let distance = Utils.VEC3_DISTANCE(trigger.getPosition(), this.controller.getPosition());
      let distanceMin = this.controller.getRadius() + trigger.getRadius();

      if (trigger.getOnEnterBlockId() && !trigger.isHovered() && distance < distanceMin) {
        this.scriptMachine.jump(trigger.getOnEnterBlockId());
        trigger.setHovered(true);
      }
      else if (trigger.getOnLeaveBlockId() && trigger.isHovered() && distance > distanceMin) {
        this.scriptMachine.jump(trigger.getOnLeaveBlockId());
        trigger.setHovered(false);
      }
    }
  }

  async $loadRoom(path, spawnName) {
    this.controller.setControllable(false);
    await this.loadFromFile(path, spawnName);
    this.controller.setControllable(true);
  }

  $continue() {
    this.controller.setControllable(true);
  }

  $stop() {
    this.controller.setControllable(false);
  }

  async $uiCreateDialog(author, picture, text, width, x, y, actions = []) {
    this.scriptMachine.setEnabled(false);
    let uiBubble = new UIBubble();

    uiBubble.setAuthor(author);
    uiBubble.setPicture(picture);
    uiBubble.setText(text);
    uiBubble.setWidth(width);
    uiBubble.setActions(actions);

    uiManager.addWidget(uiBubble, `position:absolute; top:${y}; left:${x}`);
    await eventManager.wait(uiBubble, 'E_PRINT_FINISHED');

    uiManager.focus(uiBubble);
    await eventManager.wait(uiBubble, 'E_CLOSE');
    uiManager.removeWidget(uiBubble);
    this.scriptMachine.setEnabled(true);
  }

  $modelPlayAnimation(modelIndex, animationName, isLooped) {
    let model = this.models[modelIndex];
    model.play(animationName, isLooped);
  }
}

module.exports.Room = Room;
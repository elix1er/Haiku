import { eventManager } from '../../lib/core/event_manager';
import { uiManager } from '../../lib/ui/ui_manager';
import { gfx3TextureManager } from '../../lib/gfx3/gfx3_texture_manager';
import { Utils } from '../../lib/core/utils';
import { Gfx3MeshJSM } from '../../lib/gfx3_mesh/gfx3_mesh_jsm';
import { Gfx3JWM } from '../../lib/gfx3_jwm/gfx3_jwm';
import { ScriptMachine } from '../../lib/script/script_machine';
import { UIDialog } from '../../lib/ui_dialog/ui_dialog';
// ---------------------------------------------------------------------------------------
import { Spawn } from './spawn';
import { Model } from './model';
import { Trigger } from './trigger';
import { Controller } from './controller';
import { TrackingCamera } from './tracking_camera';
// ---------------------------------------------------------------------------------------

class Room {
  constructor() {
    this.name = '';
    this.description = '';
    this.map = new Gfx3MeshJSM();
    this.walkmesh = new Gfx3JWM();
    this.controller = new Controller();
    this.camera = new TrackingCamera(0);
    this.scriptMachine = new ScriptMachine();
    this.spawns = [];
    this.models = [];
    this.triggers = [];

    this.scriptMachine.registerCommand('LOAD_ROOM', this.$loadRoom.bind(this));
    this.scriptMachine.registerCommand('CONTINUE', this.$continue.bind(this));
    this.scriptMachine.registerCommand('STOP', this.$stop.bind(this));
    this.scriptMachine.registerCommand('UI_CREATE_DIALOG', this.$uiCreateDialog.bind(this));
    this.scriptMachine.registerCommand('MODEL_PLAY_ANIMATION', this.$modelPlayAnimation.bind(this));
  }

  async loadFromFile(path, spawnName) {
    let response = await fetch(path);
    let json = await response.json();

    this.name = json['Name'];
    this.description = json['Description'];

    this.map = new Gfx3MeshJSM();
    await this.map.loadFromFile(json['MapFile']);
    this.map.setMaterial({ texture: await gfx3TextureManager.loadTexture(json['MapTextureFile']) });

    this.walkmesh = new Gfx3JWM();
    await this.walkmesh.loadFromFile(json['WalkmeshFile']);

    this.controller = new Controller();
    await this.controller.loadFromData(json['Controller']);

    this.camera = new TrackingCamera(0);
    await this.camera.loadFromData(json['Camera']);
    this.camera.setTarget(this.controller);

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

  delete() {
    for (const model of this.models) {
      model.delete();
    }

    eventManager.unsubscribe(this.controller, 'E_ACTION', this);
    eventManager.unsubscribe(this.controller, 'E_MOVED', this);
  }

  update(ts) {
    this.map.update(ts);
    this.walkmesh.update(ts);
    this.controller.update(ts);
    this.camera.update(ts);
    this.scriptMachine.update(ts);

    for (let model of this.models) {
      model.update(ts);
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

  async $uiCreateDialog(author, text) {
    this.scriptMachine.setEnabled(false);
    let uiDialog = new UIDialog();
    uiDialog.setAuthor(author);
    uiDialog.setText(text);

    uiManager.addWidget(uiDialog);
    uiManager.focus(uiDialog);
    await eventManager.wait(uiDialog, 'E_OK');
    uiManager.removeWidget(uiDialog);
    this.scriptMachine.setEnabled(true);
  }

  $modelPlayAnimation(modelIndex, animationName, isLooped) {
    let model = this.models[modelIndex];
    model.play(animationName, isLooped);
  }
}

export { Room };
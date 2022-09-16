import { eventManager } from '../core/event_manager.js';
import { inputManager } from '../input/input_manager.js';

class UIWidget {
  constructor(options = {}) {
    this.id = options.id ?? '';
    this.className = options.className ?? '';
    this.template = options.template ?? '';
    this.node = document.createElement('div');
    this.node.className = this.className;
    this.node.innerHTML = this.template;

    this.node.addEventListener('animationend', () => eventManager.emit(this, 'E_ANIMATION_FINISHED'));
  }

  update(ts) {
    // virtual method called during update phase !
  }

  delete() {
    this.node.remove();
    this.node = null;
    eventManager.unsubscribe(inputManager, 'E_ACTION', this);
  }

  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getNode() {
    return this.node;
  }

  appendStyles(styles) {
    this.node.style.cssText += styles;
  }

  focus() {
    this.node.classList.add('u-focused');
    eventManager.emit(this, 'E_FOCUSED');
    eventManager.subscribe(inputManager, 'E_ACTION', this, (data) => this.onAction(data.actionId));
  }

  unfocus() {
    this.node.classList.remove('u-focused');
    eventManager.emit(this, 'E_UNFOCUSED');
    eventManager.unsubscribe(inputManager, 'E_ACTION', this);
  }

  isFocused() {
    return this.node.classList.contains('u-focused') == true;
  }

  setVisible(visible) {
    if (visible) {
      this.node.classList.remove('u-hidden');
    }
    else {
      this.node.classList.add('u-hidden');
    }
  }

  isVisible() {
    return this.node.classList.contains('u-hidden') == false;
  }

  setEnabled(enabled) {
    if (enabled) {
      this.node.classList.remove('u-disabled');
    }
    else {
      this.node.classList.add('u-disabled');
    }
  }

  isEnabled() {
    return this.node.classList.contains('u-disabled') === false;
  }

  setSelected(selected) {
    if (selected) {
      this.node.classList.add('u-selected');
    }
    else {
      this.node.classList.remove('u-selected');
    }
  }

  isSelected() {
    return this.node.classList.contains('u-selected');
  }

  animate(animation) {
    this.node.style.animation = animation;
  }

  onAction(actionId) {
    // virtual method.
  }
}

export { UIWidget };
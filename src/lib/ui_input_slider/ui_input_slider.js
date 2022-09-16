import { eventManager } from '../core/event_manager.js';
import { UIWidget } from './ui_widget.js';

class UIInputSlider extends UIWidget {
  constructor() {
    super({
      className: 'UIInputSlider',
      template: `
      <input class="UIInputSlider-range js-range" type="range" min="0" max="0" step="1" value="0">
      <div class="UIInputSlider-value js-value">0</div>`
    });

    this.value = 0;
    this.min = 0;
    this.max = 0;
    this.step = 1;
  }

  setValue(value) {
    if (value == this.value) {
      return;
    }

    this.node.querySelector('.js-range').value = value;
    this.node.querySelector('.js-value').textContent = value;
    this.value = value;    
  }

  setMin(min) {
    this.node.querySelector('.js-range').min = min;
    this.min = min;
  }

  setMax(max) {
    this.node.querySelector('.js-range').max = max;
    this.max = max;
  }

  setStep(step) {
    this.node.querySelector('.js-range').step = step;
    this.step = step;
  }

  onKeyDown(e) {
    if (e.key == 'ArrowLeft' && this.value - this.step >= this.min) {
      this.value -= this.step;
      eventManager.emit(this, 'E_VALUE_CHANGED', { value: this.value });
    }
    else if (e.key == 'ArrowRight' && this.value + this.step <= this.max) {
      this.value += this.step;
      eventManager.emit(this, 'E_VALUE_CHANGED', { value: this.value });
    }

    this.node.querySelector('.js-range').value = this.value;
    this.node.querySelector('.js-value').textContent = this.value;
  }
}

export { UIInputSlider };
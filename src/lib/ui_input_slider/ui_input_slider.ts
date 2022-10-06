import { eventManager } from '../core/event_manager';
import { UIWidget } from '../ui/ui_widget';

class UIInputSlider extends UIWidget {
  value: number;
  min: number;
  max: number;
  step: number;

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

  setValue(value: number): void {
    if (value == this.value) {
      return;
    }

    this.node.querySelector<any>('.js-range').value = value;
    this.node.querySelector<any>('.js-value').textContent = value;
    this.value = value;    
  }

  setMin(min: number): void {
    this.node.querySelector<any>('.js-range').min = min;
    this.min = min;
  }

  setMax(max: number): void {
    this.node.querySelector<any>('.js-range').max = max;
    this.max = max;
  }

  setStep(step: number): void {
    this.node.querySelector<any>('.js-range').step = step;
    this.step = step;
  }

  onAction(actionId: string): void {
    if (actionId == 'LEFT' && this.value - this.step >= this.min) {
      this.value -= this.step;
      eventManager.emit(this, 'E_VALUE_CHANGED', { value: this.value });
    }
    else if (actionId == 'RIGHT' && this.value + this.step <= this.max) {
      this.value += this.step;
      eventManager.emit(this, 'E_VALUE_CHANGED', { value: this.value });
    }

    this.node.querySelector<any>('.js-range').value = this.value;
    this.node.querySelector<any>('.js-value').textContent = this.value;
  }
}

export { UIInputSlider };
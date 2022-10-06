import { eventManager } from '../core/event_manager';
import { UIWidget } from '../ui/ui_widget';

class UIPrint extends UIWidget {
  text: string;
  stepDuration: number;
  currentTextOffset: number;
  timeElapsed: number;
  finished: boolean;

  constructor() {
    super({
      className: 'UIPrint',
      template: `
      <div class="UIPrint-textbox">
        <div class="UIPrint-textbox-text js-text"></div>
        <div class="UIPrint-textbox-next js-next"></div>
      </div>`
    });

    this.text = '';
    this.stepDuration = 0;
    this.currentTextOffset = 0;
    this.timeElapsed = 0;
    this.finished = false;

    this.node.addEventListener('click', () => this.handleClick());
  }

  update(ts: number): void {
    if (this.finished) {
      return;
    }

    if (this.currentTextOffset == this.text.length) {
      this.finished = true;
      this.node.querySelector<HTMLElement>('.js-next')!.style.display = 'block';
      eventManager.emit(this, 'E_PRINT_FINISHED');
      return;
    }

    if (this.timeElapsed >= this.stepDuration) {
      if (this.currentTextOffset < this.text.length) {
        this.node.querySelector<HTMLElement>('.js-text')!.textContent = this.text.substring(0, this.currentTextOffset + 1);
        this.currentTextOffset++;
      }

      this.timeElapsed = 0;
    }
    else {
      this.timeElapsed += ts;
    }
  }

  setText(text: string): void {
    this.text = text;
    this.currentTextOffset = 0;
    this.finished = false;
    this.node.querySelector<HTMLElement>('.js-next')!.style.display = 'none';
  }

  setStepDuration(stepDuration: number): void {
    this.stepDuration = stepDuration;
  }

  onAction(actionId: string) {
    if (actionId === 'OK' && this.finished) {
      eventManager.emit(this, 'E_OK');
    }
  }

  handleClick(): void {
    if (this.isFocused() && this.finished) {
      eventManager.emit(this, 'E_OK');
    }
  }
}

export { UIPrint };
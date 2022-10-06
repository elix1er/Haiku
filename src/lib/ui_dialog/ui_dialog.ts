import { eventManager } from '../core/event_manager.js';
import { UIWidget } from '../ui/ui_widget.js';

class UIDialog extends UIWidget {
  text: string;
  stepDuration: number;
  currentTextOffset: number;
  timeElapsed: number;
  finished: boolean;

  constructor() {
    super({
      className: 'UIDialog',
      template: `
      <div class="UIDialog-author js-author"></div>
      <div class="UIDialog-textbox">
        <div class="UIDialog-textbox-text js-text"></div>
        <div class="UIDialog-textbox-next js-next"></div>
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
      this.node.querySelector<any>('.js-next').style.display = 'block';
      eventManager.emit(this, 'E_PRINT_FINISHED');
      return;
    }

    if (this.timeElapsed >= this.stepDuration) {
      if (this.currentTextOffset < this.text.length) {
        this.node.querySelector<any>('.js-text').textContent = this.text.substring(0, this.currentTextOffset + 1);
        this.currentTextOffset++;
      }

      this.timeElapsed = 0;
    }
    else {
      this.timeElapsed += ts;
    }
  }

  setAuthor(author: string): void {
    this.node.querySelector<any>('.UIDialog-author').textContent = author;
  }

  setText(text: string): void {
    this.text = text;
    this.currentTextOffset = 0;
    this.finished = false;
    this.node.querySelector<any>('.js-next').style.display = 'none';
  }

  setStepDuration(stepDuration: number): void {
    this.stepDuration = stepDuration;
  }

  onAction(actionId: string): void {
    if (actionId == 'OK' && this.finished) {
      eventManager.emit(this, 'E_OK');
    }
  }

  handleClick(): void {
    if (this.isFocused() && this.finished) {
      eventManager.emit(this, 'E_OK');
    }
  }
}

export { UIDialog };
import { eventManager } from '../core/event_manager.js';
import { UIWidget } from '../ui/ui_widget.js';

class UIPrint extends UIWidget {
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
    this.isFinished = false;

    this.node.addEventListener('click', (e) => this.handleClick(e));
  }

  update(ts) {
    if (this.isFinished) {
      return;
    }

    if (!this.isFinished && this.currentTextOffset == this.text.length) {
      this.isFinished = true;
      this.node.querySelector('.js-next').style.display = 'block';
      eventManager.emit(this, 'E_PRINT_FINISHED');
      return;
    }

    if (this.timeElapsed >= this.stepDuration) {
      if (this.currentTextOffset < this.text.length) {
        this.node.querySelector('.js-text').textContent = this.text.substring(0, this.currentTextOffset + 1);
        this.currentTextOffset++;
      }

      this.timeElapsed = 0;
    }
    else {
      this.timeElapsed += ts;
    }
  }

  setText(text) {
    this.text = text;
    this.currentTextOffset = 0;
    this.isFinished = false;
    this.node.querySelector('.js-next').style.display = 'none';
  }

  setStepDuration(stepDuration) {
    this.stepDuration = stepDuration;
  }

  handleClick(e) {
    if (this.isFocused() && this.isFinished) {
      eventManager.emit(this, 'E_CLOSE');
    }
  }

  onKeyDown(e) {
    if (e.key == 'Enter' && this.isFinished) {
      eventManager.emit(this, 'E_CLOSE');
    }
  }
}

export { UIPrint };
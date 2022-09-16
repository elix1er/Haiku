import { eventManager } from '../core/event_manager.js';
import { UIWidget } from '../ui/ui_widget.js';

class UIMessage extends UIWidget {
  constructor() {
    super({
      className: 'UIMessage',
      template: `
      <div class="UIMessage-inner">
        <div class="UIMessage-picture js-picture"></div>
        <div class="UIMessage-textbox">
          <div class="UIMessage-textbox-author js-author"></div>
          <div class="UIMessage-textbox-text js-text"></div>
          <div class="UIMessage-textbox-next js-next"></div>
        </div>
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

  setPicture(pictureFile) {
    this.node.querySelector('.js-picture').innerHTML = '<img class="UIMessage-picture-img" src="' + pictureFile + '">';
  }

  setAuthor(author) {
    this.node.querySelector('.js-author').textContent = author;
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

export { UIMessage };
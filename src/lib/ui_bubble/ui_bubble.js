import { eventManager } from '../core/event_manager.js';
import { UIWidget } from '../ui/ui_widget.js';
import { UIMenuText } from '../ui_menu_text/ui_menu_text.js';

class UIBubble extends UIWidget {
  constructor() {
    super({
      className: 'UIBubble',
      template: `
      <img class="UIBubble-picture js-picture" src=""/>
      <div class="UIBubble-content">
        <div class="UIBubble-author js-author"></div>
        <div class="UIBubble-text js-text"></div>
        <div class="UIBubble-menu js-menu"></div>
      </div>`
    });

    this.text = '';
    this.actions = [];
    this.stepDuration = 0;
    this.currentTextOffset = 0;
    this.currentActionTextOffset = 0;
    this.currentActionIndex = 0;
    this.timeElapsed = 0;
    this.isFinished = false;

    this.uiMenu = new UIMenuText();
    this.node.querySelector('.js-menu').replaceWith(this.uiMenu.getNode());
    eventManager.subscribe(this.uiMenu, 'E_ITEM_SELECTED', this, this.handleMenuItemSelected);
  }

  update(ts) {
    this.uiMenu.update(ts);

    if (!this.isFinished && this.currentTextOffset == this.text.length && this.currentActionIndex == this.actions.length) {
      this.isFinished = true;
      eventManager.emit(this, 'E_PRINT_FINISHED');
      return;
    }

    if (this.timeElapsed >= this.stepDuration) {
      if (this.currentTextOffset < this.text.length) {
        this.node.querySelector('.js-text').textContent = this.text.substring(0, this.currentTextOffset + 1);
        this.currentTextOffset++;
      }
      else if (this.currentActionIndex < this.actions.length) {
        if (this.currentActionTextOffset == 0) {
          this.uiMenu.add(this.currentActionIndex, '');
        }

        if (this.currentActionTextOffset < this.actions[this.currentActionIndex].length) {
          this.uiMenu.set(this.currentActionIndex, this.actions[this.currentActionIndex].substring(0, this.currentActionTextOffset + 1));
          this.currentActionTextOffset++;
        }
        else {
          this.currentActionIndex++;
          this.currentActionTextOffset = 0;
        }
      }

      this.timeElapsed = 0;
    }
    else {
      this.timeElapsed += ts;
    }
  }

  delete() {
    this.uiMenu.delete();
    super.delete();
  }

  focus() {
    this.uiMenu.focus();
    super.focus();
  }

  unfocus() {
    this.uiMenu.unfocus();
    super.unfocus();
  }

  setPicture(pictureFile) {
    this.node.querySelector('.js-picture').src = pictureFile;
  }

  setAuthor(author) {
    this.node.querySelector('.js-author').textContent = author;
  }

  setWidth(width) {
    this.node.style.width = width + 'px';
  }

  setText(text) {
    this.text = text;
    this.currentTextOffset = 0;
    this.isFinished = false;
  }

  setActions(actions) {
    this.actions = actions;
    this.currentActionIndex = 0;
    this.currentActionTextOffset = 0;
    this.isFinished = false;
    this.uiMenu.clear();
  }

  setStepDuration(stepDuration) {
    this.stepDuration = stepDuration;
  }

  handleMenuItemSelected(data) {
    eventManager.emit(this, 'E_ITEM_SELECTED', data);
  }

  onKeyDown(e) {
    if (e.key == 'Enter' && this.isFinished) {
      eventManager.emit(this, 'E_CLOSE');
    }
  }
}

export { UIBubble };
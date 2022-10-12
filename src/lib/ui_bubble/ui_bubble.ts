import { eventManager } from '../core/event_manager';
import { UIWidget } from '../ui/ui_widget';
import { UIMenuText } from '../ui_menu_text/ui_menu_text';

class UIBubble extends UIWidget {
  uiMenu: UIMenuText;
  text: string;
  actions: Array<string>;
  stepDuration: number;
  currentTextOffset: number;
  currentActionTextOffset: number;
  currentActionIndex: number;
  timeElapsed: number;
  finished: boolean;

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

    this.uiMenu = new UIMenuText();
    this.text = '';
    this.actions = [];
    this.stepDuration = 0;
    this.currentTextOffset = 0;
    this.currentActionTextOffset = 0;
    this.currentActionIndex = 0;
    this.timeElapsed = 0;
    this.finished = false;

    this.node.querySelector<HTMLElement>('.js-menu')!.replaceWith(this.uiMenu.getNode());
    eventManager.subscribe(this.uiMenu, 'E_ITEM_SELECTED', this, this.handleMenuItemSelected);
  }

  update(ts: number): void {
    this.uiMenu.update(ts);

    if (this.currentTextOffset == this.text.length && this.currentActionIndex == this.actions.length) {
      this.finished = true;
      eventManager.emit(this, 'E_PRINT_FINISHED');
      return;
    }

    if (this.timeElapsed >= this.stepDuration) {
      if (this.currentTextOffset < this.text.length) {
        this.node.querySelector<HTMLElement>('.js-text')!.textContent = this.text.substring(0, this.currentTextOffset + 1);
        this.currentTextOffset++;
      }
      else if (this.currentActionIndex < this.actions.length) {
        if (this.currentActionTextOffset == 0) {
          this.uiMenu.add(this.currentActionIndex.toString(), '');
        }

        if (this.currentActionTextOffset < this.actions[this.currentActionIndex].length) {
          this.uiMenu.set(this.currentActionIndex.toString(), this.actions[this.currentActionIndex].substring(0, this.currentActionTextOffset + 1));
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

  delete(): void {
    eventManager.unsubscribe(this.uiMenu, 'E_ITEM_SELECTED', this);
    this.uiMenu.delete();
    super.delete();
  }

  focus(): void {
    if (this.actions.length > 0) {
      this.uiMenu.focus();
    }

    super.focus();
  }

  unfocus(): void {
    if (this.actions.length > 0) {
      this.uiMenu.unfocus();
    }

    super.unfocus();
  }

  setPicture(pictureFile: string): void {
    this.node.querySelector<HTMLImageElement>('.js-picture')!.src = pictureFile;
  }

  setAuthor(author: string): void {
    this.node.querySelector<HTMLElement>('.js-author')!.textContent = author;
  }

  setWidth(width: number): void {
    this.node.style.width = width + 'px';
  }

  setText(text: string): void {
    this.text = text;
    this.currentTextOffset = 0;
    this.finished = false;
  }

  setActions(actions: Array<string>): void {
    this.actions = actions;
    this.currentActionIndex = 0;
    this.currentActionTextOffset = 0;
    this.finished = false;
    this.uiMenu.clear();
  }

  setStepDuration(stepDuration: number): void {
    this.stepDuration = stepDuration;
  }

  onAction(actionId: string): void {
    if (actionId == 'OK' && this.finished) {
      eventManager.emit(this, 'E_OK');
    }
  }

  handleMenuItemSelected(data: any): void {
    eventManager.emit(this, 'E_MENU_ITEM_SELECTED', data);
  }
}

export { UIBubble };
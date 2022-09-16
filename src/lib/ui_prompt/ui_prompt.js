import { eventManager } from '../core/event_manager.js';
import { UIWidget } from '../ui/ui_widget.js';
import { UIMenuText, MenuAxisEnum } from '../ui_menu_text/ui_menu_text.js';

class UIPrompt extends UIWidget {
  constructor() {
    super({
      className: 'UIPrompt',
      template: `
      <div class="UIPrompt-text js-text"></div>
      <div class="UIPrompt-menu js-menu"></div>`
    });

    this.uiMenu = new UIMenuText({ axis: MenuAxisEnum.X });
    this.node.querySelector('.js-menu').replaceWith(this.uiMenu.getNode());
    eventManager.subscribe(this.uiMenu, 'E_ITEM_SELECTED', this, this.handleMenuItemSelected);
  }

  update(ts) {
    this.uiMenu.update(ts);
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

  setText(text) {
    this.node.querySelector('.js-text').textContent = text;
  }

  setActionMap(actionMap) {
    this.uiMenu.clear();
    for (let actionKey in actionMap) {
      this.uiMenu.add(actionKey, actionMap[actionKey]);
    }
  }

  handleMenuItemSelected(data) {
    eventManager.emit(this, 'E_ITEM_SELECTED', data);
  }
}

export { UIPrompt };
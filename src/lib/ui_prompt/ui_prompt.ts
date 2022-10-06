import { eventManager } from '../core/event_manager';
import { UIWidget } from '../ui/ui_widget';
import { MenuAxis } from '../ui_menu/ui_menu';
import { UIMenuText } from '../ui_menu_text/ui_menu_text';

class UIPrompt extends UIWidget {
  uiMenu: UIMenuText;

  constructor() {
    super({
      className: 'UIPrompt',
      template: `
      <div class="UIPrompt-text js-text"></div>
      <div class="UIPrompt-menu js-menu"></div>`
    });

    this.uiMenu = new UIMenuText({ axis: MenuAxis.X });
    this.node.querySelector('.js-menu')!.replaceWith(this.uiMenu.getNode());
    eventManager.subscribe(this.uiMenu, 'E_ITEM_SELECTED', this, this.handleMenuItemSelected);
  }

  update(ts: number): void {
    this.uiMenu.update(ts);
  }

  delete(): void {
    this.uiMenu.delete();
    super.delete();
  }

  focus(): void {
    this.uiMenu.focus();
    super.focus();
  }

  unfocus(): void {
    this.uiMenu.unfocus();
    super.unfocus();
  }

  setText(text: string): void {
    this.node.querySelector('.js-text')!.textContent = text;
  }

  addAction(id: string, text: string): void {
    this.uiMenu.add(id, text);
  }

  removeAction(id: string): void {
    this.uiMenu.remove(id);
  }

  clearActions() {
    this.uiMenu.clear();
  }

  handleMenuItemSelected(data: any) {
    eventManager.emit(this, 'E_ITEM_SELECTED', data);
  }
}

export { UIPrompt };
import { UIMenu } from '../ui_menu/ui_menu';
import { MenuAxis } from '../ui_menu/ui_menu';
import { UIMenuTextItem } from './ui_menu_text_item';

class UIMenuText extends UIMenu {
  constructor(options: { axis?: MenuAxis, className?: string } = {}) {
    super(Object.assign(options, {
      className: options.className ?? 'UIMenuText'
    }));
  }

  add(id: string, text: string): void {
    const item = new UIMenuTextItem();
    item.setId(id);
    item.setText(text);
    this.addWidget(item);
  }

  set(id: string, text: string): void {
    const item = this.widgets.find(w => w.getId() == id) as UIMenuTextItem;
    if (!item) {
      throw new Error('UIMenuText::set(): item not found !');
    }

    item.setText(text);
  }

  remove(id: string): void {
    const widgetIndex = this.widgets.findIndex(w => w.getId() == id);
    if (widgetIndex == -1) {
      throw new Error('UIMenuText::remove(): item not found !');
    }

    this.removeWidget(widgetIndex);
  }

  getSelectedId(): string | null {
    return this.getSelectedWidgetId();
  }
}

export { UIMenuText };
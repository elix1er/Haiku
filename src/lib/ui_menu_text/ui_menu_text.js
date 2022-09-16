import { UIMenu } from '../ui_menu/ui_menu.js';
import { UIMenuTextItem } from './ui_menu_text_item.js';

class UIMenuText extends UIMenu {
  constructor(options = {}) {
    super(Object.assign(options, {
      className: 'UIMenuText'
    }));
  }

  add(id, text) {
    let item = new UIMenuTextItem();
    item.setId(id);
    item.setText(text);
    this.addWidget(item);
  }

  set(id, text) {
    let item = this.widgets.find(w => w.getId() == id);
    if (item == -1) {
      throw new Error('UIMenuText::set(): item not found !');
    }

    item.setText(text);
  }

  remove(id) {
    let widgetIndex = this.widgets.findIndex(w => w.getId() == id);
    if (widgetIndex == -1) {
      throw new Error('UIMenuText::remove(): item not found !');
    }

    this.removeWidget(widgetIndex);
  }

  getSelectedId() {
    return this.getSelectedWidgetId();
  }
}

export { UIMenuText };
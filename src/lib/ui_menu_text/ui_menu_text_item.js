import { UIWidget } from '../ui/ui_widget.js';

class UIMenuTextItem extends UIWidget {
  constructor(options = {}) {
    super({
      className: 'UIMenuTextItem'
    });

    this.node.textContent = options.text ?? '';
  }

  setText(text) {
    this.node.textContent = text;
  }
}

export { UIMenuTextItem };
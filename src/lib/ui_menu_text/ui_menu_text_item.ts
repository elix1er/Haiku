import { UIWidget } from '../ui/ui_widget';

class UIMenuTextItem extends UIWidget {
  constructor(options: { text?: string } = {}) {
    super({
      className: 'UIMenuTextItem'
    });

    this.node.textContent = options.text ?? '';
  }

  setText(text: string): void {
    this.node.textContent = text;
  }
}

export { UIMenuTextItem };
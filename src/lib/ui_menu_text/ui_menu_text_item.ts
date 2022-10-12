import { UIWidget } from '../ui/ui_widget';

class UIMenuTextItem extends UIWidget {
  constructor(options: { className?: string } = {}) {
    super({
      className: options.className ?? 'UIMenuTextItem'
    });
  }

  setText(text: string): void {
    this.node.textContent = text;
  }
}

export { UIMenuTextItem };
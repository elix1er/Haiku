import { UIWidget } from '../ui/ui_widget';

class UIText extends UIWidget {
  constructor() {
    super({
      className: 'UIText',
      template: '<span class="UIText-text js-text"></span>'
    });
  }

  setText(text: string): void {
    this.node.querySelector('.js-text')!.textContent = text;
  }
}

export { UIText };
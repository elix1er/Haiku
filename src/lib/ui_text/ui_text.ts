import { UIWidget } from '../ui/ui_widget';

class UIText extends UIWidget {
  constructor(txtStyle='') {
    super({
      className: 'UIText',
      template: '<span class="UIText-text js-text" style="'+txtStyle+'"></span>'
    });
  }

  setText(text: string): void {
    this.node.querySelector('.js-text')!.textContent = text;
  }
}

export { UIText };
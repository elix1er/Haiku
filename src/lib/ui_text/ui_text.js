let { UIWidget } = require('../ui/ui_widget');

class UIText extends UIWidget {
  constructor() {
    super({
      className: 'UIText',
      template: '<span class="UIText-text js-text"></span>'
    });
  }

  setText(text) {
    this.node.querySelector('.js-text').textContent = text;
  }
}

module.exports.UIText = UIText;
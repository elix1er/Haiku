let { UIWidget } = require('../ui/ui_widget');

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

module.exports.UIMenuTextItem = UIMenuTextItem;
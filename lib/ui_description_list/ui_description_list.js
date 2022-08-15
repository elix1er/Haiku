let { UIWidget } = require('../ui/ui_widget');

class UIDescriptionList extends UIWidget {
  constructor() {
    super({
      className: 'UIDescriptionList'
    });
  }

  addItem(id, label, value) {
    let tpl = document.createElement('template');
    tpl.innerHTML = `
      <span class="UIDescriptionList-item js-${id}">
        <span class="UIDescriptionList-item-label js-label">${label}</span>
        <span class="UIDescriptionList-item-value js-value">${value}</span>
      </span>`;

    this.node.appendChild(tpl.content);
  }

  removeItem(id) {
    let item = this.node.querySelector('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::removeItem(): item not found !');
    }

    this.node.removeChild(item);
  }

  setItem(id, value) {
    let item = this.node.querySelector('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::setItem(): item not found !');
    }

    item.querySelector('.js-value').textContent = value;
  }

  setItemVisible(id, visible) {
    let item = this.node.querySelector('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::setItemVisible(): item not found !');
    }

    item.style.display = (visible) ? 'block' : 'none';
  }

  getItemVisible(id) {
    let item = this.node.querySelector('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::getItemVisible(): item not found !');
    }

    return item.style.display == 'block';
  }

  getItemValue(id) {
    let item = this.node.querySelector('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::getItemValue(): item not found !');
    }

    return item.querySelector('.js-value').textContent;
  }

  clear() {
    this.node.innerHTML = '';
  }
}

module.exports.UIDescriptionList = UIDescriptionList;
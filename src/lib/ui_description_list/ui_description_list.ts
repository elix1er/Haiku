import { UIWidget } from '../ui/ui_widget.js';

class UIDescriptionList extends UIWidget {
  constructor() {
    super({
      className: 'UIDescriptionList'
    });
  }

  addItem(id: string, label: string, value: string): void {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
    <span class="UIDescriptionList-item js-${id}">
      <span class="UIDescriptionList-item-label js-label">${label}</span>
      <span class="UIDescriptionList-item-value js-value">${value}</span>
    </span>`;

    this.node.appendChild(tpl.content);
  }

  removeItem(id: string): void {
    const item = this.node.querySelector('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::removeItem(): item not found !');
    }

    this.node.removeChild(item);
  }

  setItem(id: string, value: string): void {
    const item = this.node.querySelector('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::setItem(): item not found !');
    }

    item.querySelector<HTMLElement>('.js-value')!.textContent = value;
  }

  getItemValue(id: string): string {
    const item = this.node.querySelector<HTMLElement>('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::getItemValue(): item not found !');
    }

    const value = item.querySelector<HTMLElement>('.js-value')!.textContent;
    return value ? value : '';
  }

  isItemVisible(id: string): boolean {
    const item = this.node.querySelector<HTMLElement>('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::getItemVisible(): item not found !');
    }

    return !item.classList.contains('u-hidden');
  }

  setItemVisible(id: string, visible: boolean): void {
    const item = this.node.querySelector<HTMLElement>('.js-' + id);
    if (!item) {
      throw new Error('UIDescriptionList::setItemVisible(): item not found !');
    }

    if (visible) {
      item.classList.remove('u-hidden');
    }
    else {
      item.classList.add('u-hidden');
    }
  }

  clear() {
    this.node.innerHTML = '';
  }
}

export { UIDescriptionList };
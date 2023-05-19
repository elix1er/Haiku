import { eventManager } from '../core/event_manager';
import { inputManager } from '../input/input_manager';

class UIWidget {
  id: string;
  className: string;
  template: string;
  node: HTMLDivElement;

  constructor(options: { id?: string, className?: string, template?: string } = {}) {
    this.id = options.id ?? '';
    this.className = options.className ?? '';
    this.template = options.template ?? '';
    this.node = document.createElement('div');
    this.node.className = this.className;
    this.node.innerHTML = this.template;

    this.node.addEventListener('animationend', () => eventManager.emit(this, 'E_ANIMATION_FINISHED'));
  }

  update(ts: number): void {
    // virtual method called during update phase !
  }

  delete(): void {
    this.node.remove();
    eventManager.unsubscribe(inputManager, 'E_ACTION', this);
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): void {
    this.id = id;
    this.node.id = id;
  }

  getNode(): HTMLDivElement {
    return this.node;
  }

  appendStyles(styles: string): void {
    this.node.style.cssText += styles;
  }

  focus(): void {
    this.node.classList.add('u-focused');
    eventManager.emit(this, 'E_FOCUSED');
    eventManager.subscribe(inputManager, 'E_ACTION', this, (data: any) => this.onAction(data.actionId));
  }

  unfocus(): void {
    this.node.classList.remove('u-focused');
    eventManager.emit(this, 'E_UNFOCUSED');
    eventManager.unsubscribe(inputManager, 'E_ACTION', this);
  }

  isFocused(): boolean {
    return this.node.classList.contains('u-focused');
  }

  setVisible(visible: boolean): void {
    if (visible) {
      this.node.classList.remove('u-hidden');
    }
    else {
      this.node.classList.add('u-hidden');
    }
  }

  isVisible(): boolean {
    return !this.node.classList.contains('u-hidden');
  }

  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.node.classList.remove('u-disabled');
    }
    else {
      this.node.classList.add('u-disabled');
    }
  }

  isEnabled(): boolean {
    return !this.node.classList.contains('u-disabled');
  }

  setSelected(selected: boolean): void {
    if (selected) {
      this.node.classList.add('u-selected');
    }
    else {
      this.node.classList.remove('u-selected');
    }
  }

  isSelected(): boolean {
    return this.node.classList.contains('u-selected');
  }

  animate(animation: string): void {
    this.node.style.animation = animation;
  }

  onAction(actionId: string): void {
    // virtual method.
  }
}

export { UIWidget };
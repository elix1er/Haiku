import { eventManager } from '../core/event_manager';
import { UIWidget } from './ui_widget';

class UIManager {
  root: HTMLDivElement;
  fadeLayer: HTMLDivElement;
  overLayer: HTMLDivElement;
  focusedWidget: UIWidget | null;
  widgets: Array<UIWidget>;

  constructor() {
    this.root = <HTMLDivElement>document.getElementById('UI_ROOT');
    this.fadeLayer = <HTMLDivElement>document.getElementById('UI_FADELAYER');
    this.overLayer = <HTMLDivElement>document.getElementById('UI_OVERLAYER');
    this.focusedWidget = null;
    this.widgets = [];
  }

  update(ts: number): void {
    for (let widget of this.widgets) {
      widget.update(ts);
    }
  }

  getWidgets(): Array<UIWidget> {
    return this.widgets;
  }

  focus(widget: UIWidget): void {
    if (this.focusedWidget) {
      this.focusedWidget.unfocus();
    }

    widget.focus();
    this.focusedWidget = widget;
    eventManager.emit(this, 'E_FOCUSED', { widget: widget });
  }

  unfocus(): void {
    if (!this.focusedWidget) {
      return;
    }

    this.focusedWidget.unfocus();
    this.focusedWidget = null;
    eventManager.emit(this, 'E_UNFOCUSED');
  }

  addNode(node: HTMLElement, styles: string = ''): void {
    node.style.cssText += styles;
    this.root.appendChild(node);
  }

  removeNode(node: HTMLElement): void {
    this.root.removeChild(node);
  }

  addWidget(widget: UIWidget, styles: string = '') {
    widget.appendStyles(styles);
    this.root.appendChild(widget.getNode());
    this.widgets.push(widget);
    return widget;
  }

  removeWidget(widget: UIWidget) {
    const index = this.widgets.indexOf(widget);
    if (index == -1) {
      throw new Error('UIManager::removeWidget: fail to remove widget !');
    }

    if (widget == this.focusedWidget) {
      this.unfocus();
    }

    widget.delete();
    this.widgets.splice(index, 1);
    return true;
  }

  clear(): void {
    this.root.innerHTML = '';
    this.focusedWidget = null;

    while (this.widgets.length > 0) {
      let widget = this.widgets.pop()!;
      widget.delete();
    }
  }

  fadeIn(delay: number, ms: number, transitionTimingFunction: string = 'linear', cb: Function = () => { }): void {
    this.fadeLayer.style.transitionDuration = ms + 'ms';
    this.fadeLayer.style.transitionDelay = delay + 'ms';
    this.fadeLayer.style.transitionTimingFunction = transitionTimingFunction;
    this.fadeLayer.style.opacity = '1';
    setTimeout(() => { cb(); }, delay + ms);
  }

  fadeOut(delay: number, ms: number, transitionTimingFunction: string = 'linear', cb: Function = () => { }): void {
    this.fadeLayer.style.transitionDuration = ms + 'ms';
    this.fadeLayer.style.transitionDelay = delay + 'ms';
    this.fadeLayer.style.transitionTimingFunction = transitionTimingFunction;
    this.fadeLayer.style.opacity = '0';
    setTimeout(() => { cb(); }, delay + ms);
  }

  enableOverlayer(enable: boolean) {
    this.overLayer.style.opacity = (enable) ? '1' : '0';
  }
}

export { UIManager };
export const uiManager = new UIManager();
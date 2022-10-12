import { eventManager } from '../core/event_manager';
import { UIWidget } from '../ui/ui_widget';

enum MenuFocus {
  AUTO = 0,
  NONE = 1
};

enum MenuAxis {
  X = 0,
  Y = 1,
  XY = 2
};

class UIMenu extends UIWidget {
  axis: MenuAxis;
  rows: number;
  columns: number;
  multiple: boolean;
  selectable: boolean;
  widgets: Array<UIWidget>;
  focusedWidget: UIWidget | undefined;
  selectedWidgets: Array<UIWidget>;

  constructor(options: { className?: string, axis?: MenuAxis, rows?: number, columns?: number, multiple?: boolean, selectable?: boolean } = {}) {
    super({
      className: options.className ?? 'UIMenu'
    });

    this.axis = options.axis ?? MenuAxis.Y;
    this.rows = options.rows ?? 0;
    this.columns = options.columns ?? 0;
    this.multiple = options.multiple ?? false;
    this.selectable = options.selectable ?? true;
    this.widgets = [];
    this.selectedWidgets = [];

    if (this.axis == MenuAxis.X) {
      this.rows = 1;
      this.columns = Infinity;
      this.node.style.display = 'flex';
      this.node.style.flexDirection = 'row';
    }
    else if (this.axis == MenuAxis.Y) {
      this.rows = Infinity;
      this.columns = 1;
      this.node.style.display = 'flex';
      this.node.style.flexDirection = 'column';
    }
    else {
      this.node.style.display = 'grid';
      this.node.style.grid = 'repeat(' + this.rows + ', auto) / repeat(' + this.columns + ', auto)';
    }
  }

  delete(): void {
    for (const widget of this.widgets) {
      widget.delete();
    }

    super.delete();
  }

  update(ts: number): void {
    for (const widget of this.widgets) {
      widget.update(ts);
    }
  }

  focus(focusIndex = MenuFocus.AUTO): void {
    if (this.widgets.length > 0 && focusIndex == MenuFocus.AUTO) {
      const focusedIndex = this.focusedWidget ? this.widgets.indexOf(this.focusedWidget) : 0;
      this.focusWidget(focusedIndex, true);
    }

    super.focus();
  }

  addWidget(widget: UIWidget, index: number = -1): void {
    const widgetNode = widget.getNode();

    if (index == -1) {
      this.widgets.push(widget);
      this.node.appendChild(widgetNode);
    }
    else {
      this.widgets.splice(index + 1, 0, widget);
      this.node.insertBefore(widgetNode, this.node.children[index]);
    }

    widgetNode.addEventListener('click', () => this.handleWidgetClicked(widget));
    widgetNode.addEventListener('mousemove', () => this.handleWidgetHover(widget));
  }

  removeWidget(index: number): void {
    const widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::removeWidget(): widget not found !');
    }

    if (this.selectedWidgets.indexOf(widget) != -1) {
      this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);
    }

    if (this.focusedWidget == widget) {
      this.focusedWidget = undefined;
    }

    this.widgets.splice(this.widgets.indexOf(widget), 1);
    widget.delete();
  }

  focusWidget(index: number, preventScroll: boolean = false, emit: boolean = true): void {
    const widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::focusWidget(): widget not found !');
    }

    if (!preventScroll) {
      const rect = this.getViewRectWidget(index);
      if (rect.top < 0) {
        this.node.scrollTop += rect.top;
      }
      if (rect.bottom > this.node.clientHeight) {
        this.node.scrollTop += rect.bottom - this.node.clientHeight;
      }
    }

    this.widgets.forEach(w => w.unfocus());
    widget.focus();
    this.focusedWidget = widget;

    if (emit) {
      eventManager.emit(this, 'E_ITEM_FOCUSED', { id: widget.getId(), index: index });
    }
  }

  unfocusWidget(emit: boolean = true): void {
    this.widgets.forEach(w => w.unfocus());
    this.focusedWidget = undefined;

    if (emit) {
      eventManager.emit(this, 'E_ITEM_UNFOCUSED');
    }
  }

  selectWidget(index: number, emit = true): void {
    const widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::selectWidget(): widget not found !');
    }
    if (!widget.isEnabled()) {
      return;
    }

    if (this.multiple && widget.isSelected()) {
      widget.setSelected(false);
      this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);
      return;
    }

    if (!this.multiple) {
      this.widgets.forEach(w => w.setSelected(false));
      this.selectedWidgets = [];
    }

    widget.setSelected(true);
    this.selectedWidgets.push(widget);

    if (emit) {
      eventManager.emit(this, 'E_ITEM_SELECTED', { id: widget.getId(), index: index });
    }
  }

  unselectWidget(index: number, emit: boolean = true): void {
    const widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::unselectWidget(): widget not found !');
    }
    if (!widget.isSelected()) {
      return;
    }

    widget.setSelected(false);
    this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);

    if (emit) {
      eventManager.emit(this, 'E_ITEM_UNSELECTED', { id: widget.getId(), index: index });
    }
  }

  unselectWidgets(emit: boolean = true): void {
    this.widgets.forEach(w => w.setSelected(false));
    this.selectedWidgets = [];

    if (emit) {
      eventManager.emit(this, 'E_UNSELECTED');
    }
  }

  setEnabledWidget(index: number, enabled: boolean): void {
    const widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::setEnabledWidget(): widget not found !');
    }

    widget.setEnabled(enabled);
  }

  setEnabledWidgets(enabled: boolean): void {
    this.widgets.forEach(w => w.setEnabled(enabled));
  }

  clear(): void {
    this.widgets.forEach(w => w.delete());
    this.widgets = [];
    this.focusedWidget = undefined;
    this.selectedWidgets = [];
    this.node.innerHTML = '';
  }

  getViewRectWidget(index: number): { top: number, bottom: number } {
    const el = this.node.children[index] as HTMLElement;
    const top = el.offsetTop - this.node.scrollTop;
    const bottom = top + el.offsetHeight;
    return { top, bottom };
  }

  getFocusedWidgetId(): string | null {
    return this.focusedWidget ? this.focusedWidget.getId() : null;
  }

  getFocusedWidgetIndex(): number {
    return this.focusedWidget ? this.widgets.indexOf(this.focusedWidget) : -1;
  }

  getSelectedWidgetId(): string | null {
    return this.selectedWidgets[0] ? this.selectedWidgets[0].getId() : null;
  }

  getSelectedWidgetIndex(): number {
    return this.selectedWidgets[0] ? this.widgets.indexOf(this.selectedWidgets[0]) : -1;
  }

  getSelectedWidgetIds(): Array<string> {
    return this.selectedWidgets.map(w => w.getId());
  }

  getSelectedWidgetIndexes(): Array<number> {
    return this.selectedWidgets.map(w => this.widgets.indexOf(w));
  }

  getWidgets() {
    return this.widgets;
  }

  onAction(actionId: string) {
    if (actionId == 'BACK') {
      eventManager.emit(this, 'E_CLOSED');
    }
    else if (actionId == 'OK') {
      const focusedIndex = this.getFocusedWidgetIndex();
      this.selectWidget(focusedIndex);
    }
    else if (actionId == 'LEFT') {
      const focusedIndex = this.getFocusedWidgetIndex();
      const prevIndex = (focusedIndex - 1 < 0) ? this.widgets.length - 1 : focusedIndex - 1;
      this.focusWidget(prevIndex);
    }
    else if (actionId == 'RIGHT') {
      const focusedIndex = this.getFocusedWidgetIndex();
      const nextIndex = (focusedIndex + 1 > this.widgets.length - 1) ? 0 : focusedIndex + 1;
      this.focusWidget(nextIndex);
    }
    else if (actionId == 'UP') {
      const focusedIndex = this.getFocusedWidgetIndex();
      const prevIndex = (focusedIndex - this.columns < 0) ? this.widgets.length - 1 : focusedIndex - this.columns;
      this.focusWidget(prevIndex);
    }
    else if (actionId == 'DOWN') {
      const focusedIndex = this.getFocusedWidgetIndex();
      const nextIndex = (focusedIndex + this.columns > this.widgets.length - 1) ? 0 : focusedIndex + this.columns;
      this.focusWidget(nextIndex);
    }
  }

  handleWidgetClicked(widget: UIWidget) {
    if (!this.isFocused()) {
      return;
    }

    this.selectWidget(this.widgets.indexOf(widget), true);
  }

  handleWidgetHover(widget: UIWidget) {
    if (!this.isFocused()) {
      return;
    }

    this.focusWidget(this.widgets.indexOf(widget), false, true);
  }
}

export { UIMenu, MenuFocus, MenuAxis };
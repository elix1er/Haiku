import { eventManager } from '../core/event_manager';
import { ArrayCollection } from '../core/array_collection';
import { UIMenu } from '../ui_menu/ui_menu';

class UIMenuListView<T> extends UIMenu {
  collection: ArrayCollection<T>;
  views: Array<T>;
  sortPredicate: (a: T, b: T) => number;
  filterPredicate: (a: T) => boolean;
  enablePredicate: (a: T) => boolean;

  constructor(options = {}) {
    super(options);
    this.collection = new ArrayCollection<T>();
    this.views = [];
    this.sortPredicate = () => 1;
    this.filterPredicate = () => true;
    this.enablePredicate = () => true;
  }

  delete(): void {
    eventManager.unsubscribe(this.collection, 'E_ITEM_ADDED', this);
    eventManager.unsubscribe(this.collection, 'E_ITEM_REMOVED', this);
    super.delete();
  }

  setCollection(collection: ArrayCollection<T>): void {
    eventManager.unsubscribe(this.collection, 'E_ITEM_ADDED', this);
    eventManager.unsubscribe(this.collection, 'E_ITEM_REMOVED', this);
    this.clear();

    if (collection) {
      const items = collection.getItems();
      const views = items.sort(this.sortPredicate).filter(this.filterPredicate);
      views.forEach(item => this.addItem(item, this.enablePredicate(item)));
      eventManager.subscribe(collection, 'E_ITEM_ADDED', this, this.handleItemAdded);
      eventManager.subscribe(collection, 'E_ITEM_REMOVED', this, this.handleItemRemoved);
      this.collection = collection;
      this.views = views;
    }
    else {
      this.collection = new ArrayCollection<T>();
      this.views = [];
    }
  }

  addItem(item: T, enabled: boolean = true, index: number = -1): void {
    // virtual method called during item add !
  }

  getFocusedItem(): T {
    return this.views[this.getFocusedWidgetIndex()];
  }

  getSelectedItem(): T {
    return this.views[this.getSelectedWidgetIndex()];
  }

  setSortPredicate(sortPredicate: (a: T, b: T) => number): void {
    if (this.collection) {
      const items = this.collection.getItems();
      this.views = items.sort(sortPredicate).filter(this.filterPredicate);

      this.clear();
      this.views.forEach(item => this.addItem(item, this.enablePredicate(item)));
    }

    this.sortPredicate = sortPredicate;
  }

  setFilterPredicate(filterPredicate: (a: T) => boolean): void {
    if (this.collection) {
      const items = this.collection.getItems();
      this.views = items.sort(this.sortPredicate).filter(filterPredicate);

      this.clear();
      this.views.forEach(item => this.addItem(item, this.enablePredicate(item)));
    }

    this.filterPredicate = filterPredicate;
  }

  setEnablePredicate(enablePredicate: (a: T) => boolean): void {
    if (this.collection) {
      const items = this.collection.getItems();
      this.views = items.sort(this.sortPredicate).filter(this.filterPredicate);

      this.clear();
      this.views.forEach(item => this.addItem(item, enablePredicate(item)));
    }

    this.enablePredicate = enablePredicate;
  }

  getViews(): Array<T> {
    return this.views;
  }

  handleItemAdded(data: any): void {
    const items = this.collection.getItems();
    this.views = items.sort(this.sortPredicate).filter(this.filterPredicate);

    const index = this.views.indexOf(data.item);
    this.addItem(data.item, this.enablePredicate(data.item), index);
  }

  handleItemRemoved(data: any): void {
    const index = this.views.indexOf(data.item);
    this.removeWidget(index);

    const items = this.collection.getItems();
    this.views = items.sort(this.sortPredicate).filter(this.filterPredicate);    
  }
}

export { UIMenuListView };
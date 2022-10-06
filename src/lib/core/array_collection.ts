import { eventManager } from './event_manager';

class ArrayCollection<T> {
  items: Array<T>;

  constructor(items: Array<T> = []) {
    this.items = items;
  }

  getItems(): Array<T> {
    return this.items;
  }

  push(item: T, emit: boolean = false): number {
    const length = this.items.push(item);
    if (emit) {
      eventManager.emit(this, 'E_ITEM_ADDED', { item: item, index: this.items.indexOf(item) });
    }

    return length;
  }

  pop(emit: boolean = false): T | undefined {
    const item = this.items.pop();
    if (emit) {
      eventManager.emit(this, 'E_ITEM_REMOVED', { item: item, index: this.items.length });
    }

    return item;
  }

  remove(item: T, emit: boolean = false): number {
    const index = this.items.indexOf(item);
    this.items.splice(index, 1);
    if (emit) {
      eventManager.emit(this, 'E_ITEM_REMOVED', { item: item, index: index });
    }

    return index;
  }

  removeAt(index: number, emit: boolean = false): T {
    const item = this.items.splice(index, 1) as T;
    if (emit) {
      eventManager.emit(this, 'E_ITEM_REMOVED', { item: item, index: index });
    }

    return item;
  }

  has(item: T): boolean {
    return this.items.indexOf(item) != -1;
  }

  clear(): void {
    while (this.items.length) {
      this.items.pop();
    }
  }
}

export { ArrayCollection };
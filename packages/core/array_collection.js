let { eventManager } = require('./event_manager');

/**
 * The ArrayCollection class is an observable collection of items.
 */
class ArrayCollection {
  /**
   * Constructor
   * @param {array} items - Array of data source.
   */
  constructor(items = []) {
    this.items = items;
  }

  /**
   * Get array of data source.
   * @return {array} The array of data source.
   */
  getItems() {
    return this.items;
  }

  /**
   * Push element at the end of the collection.
   * Emit the E_ITEM_ADDED event.
   * @param {*} item - Element to add.
   * @param {boolean} emit - If true, E_ITEM_ADDED event is emitted.
   * @return {number} The new length of collection.
   */
  push(item, emit = false) {
    let length = this.items.push(item);
    if (emit) {
      eventManager.emit(this, 'E_ITEM_ADDED', { item: item, index: this.items.indexOf(item) });
    }

    return length;
  }

  /**
   * Pop element at the end of the collection.
   * @param {boolean} emit - If true, E_ITEM_REMOVED event is emitted.
   * @return {*} The popped element.
   */
  pop(emit = false) {
    let item = this.items.pop();
    if (emit) {
      eventManager.emit(this, 'E_ITEM_REMOVED', { item: item, index: this.items.length });
    }

    return item;
  }

  /**
   * Remove element by reference.
   * @param {*} item - The element to delete.
   * @param {boolean} emit - If true, E_ITEM_REMOVED event is emitted.
   * @return {number} Index of deleted element.
   */
  remove(item, emit = false) {
    let index = this.items.indexOf(item);
    this.items.splice(index, 1);
    if (emit) {
      eventManager.emit(this, 'E_ITEM_REMOVED', { item: item, index: index });
    }

    return index;
  }

  /**
   * Remove element by index.
   * @param {number} index - Index of element to delete.
   * @param {boolean} emit - If true, E_ITEM_REMOVED event is emitted.
   * @return {*} Deleted element.
   */
  removeAt(index, emit = false) {
    let item = this.items.splice(index, 1);
    if (emit) {
      eventManager.emit(this, 'E_ITEM_REMOVED', { item: item, index: index });
    }

    return item;
  }

  /**
   * Check if collection has the element (tested by reference).
   * @param {*} item - The element to check.
   * @return {boolean} Return true if collection has element.
   */
  has(item) {
    return this.items.indexOf(item) != -1;
  }

  /**
   * Clear the collection.
   * @param {boolean} emit - If true, E_ITEM_REMOVED event is emitted foreach element in collection.
   */
  clear(emit = false) {
    while (this.items.length) {
      this.items.pop(emit);
    }
  }
}

module.exports.ArrayCollection = ArrayCollection;

/**
 * The ECSEntity class represent a game entity with a set of components.
 */
class ECSEntity {
  constructor() {
    this.id = GENERATE_UUID();
    this.components = [];
    this.onChanged = () => { };
  }

  /**
   * Get a component by the type name.
   * @param {string} typename - The component typename.
   * @return {ECSComponent} The matching component.
   */
  getComponent(typename) {
    let found = this.components.find(c => c.typename == typename);
    if (!found) {
      throw new Error('ECSEntity::getComponent(): Entity has not ' + typename);
    }

    return found;
  }

  /**
   * Check if entity has the component.
   * @param {string} typename - The component typename.
   * @return {boolean} Return true if entity has component.
   */
  hasComponent(typename) {
    let found = this.components.find(c => c.typename == typename);
    return found ? true : false;
  }

  /**
   * Add component.
   * Nota bene: throw if entity has already the component.
   * @param {ECSComponent} component - The component.
   */
  addComponent(component) {
    let found = this.components.find(c => c.typename == component.typename);
    if (found) {
      throw new Error('ECSEntity::addComponent(): Entity already has ' + component.typename);
    }

    this.components.push(component);
    this.onChanged();
  }

  /**
   * Remove component by the type name.
   * Nota bene: throw if entity has not the component.
   */
  removeComponent(typename) {
    let found = this.components.find(c => c.typename == typename);
    if (!found) {
      throw new Error('ECSEntity::removeComponent(): Entity has not ' + typename);
    }

    this.components.splice(this.components.indexOf(found), 1);
    this.onChanged();
  }

  /**
   * Remove all components.
   */
  clear() {
    this.components = [];
    this.onChanged();
  }
}

function GENERATE_UUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports.ECSEntity = ECSEntity;

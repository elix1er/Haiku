class ECSEntity {
  constructor() {
    this.id = GENERATE_UUID();
    this.components = [];
    this.onChanged = () => { };
  }

  getComponent(typename) {
    let found = this.components.find(c => c.typename == typename);
    if (!found) {
      throw new Error('ECSEntity::getComponent(): Entity has not ' + typename);
    }

    return found;
  }

  hasComponent(typename) {
    let found = this.components.find(c => c.typename == typename);
    return found ? true : false;
  }

  addComponent(component) {
    let found = this.components.find(c => c.typename == component.typename);
    if (found) {
      throw new Error('ECSEntity::addComponent(): Entity already has ' + component.typename);
    }

    this.components.push(component);
    this.onChanged();
  }

  removeComponent(typename) {
    let found = this.components.find(c => c.typename == typename);
    if (!found) {
      throw new Error('ECSEntity::removeComponent(): Entity has not ' + typename);
    }

    this.components.splice(this.components.indexOf(found), 1);
    this.onChanged();
  }

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
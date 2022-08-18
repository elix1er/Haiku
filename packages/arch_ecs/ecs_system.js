class ECSSystem {
  constructor() {
    this.entities = [];
    this.requiredComponentTypenames = [];
  }

  bindEntity(entity) {
    if (this.entities.indexOf(entity) != -1) {
      throw new Error('ECSSystem::bindEntity(): Entity already exist in this system');
    }

    this.entities.push(entity);
  }

  unbindEntity(entity) {
    if (this.entities.indexOf(entity) == -1) {
      throw new Error('ECSSystem::unbindEntity(): Entity not exist in this system');
    }

    this.entities.splice(this.entities.indexOf(entity), 1);
  }

  hasEntity(entity) {
    return this.entities.indexOf(entity) != -1;
  }

  addRequiredComponentTypename(typename) {
    if (this.requiredComponentTypenames.indexOf(typename) != -1) {
      throw new Error('ECSSystem::addRequiredComponentTypename(): Required typename already set in this system');
    }

    this.requiredComponentTypenames.push(typename);
  }

  isMatchingEntity(entity) {
    let match = true;
    for (let typename of this.requiredComponentTypenames) {
      match = entity.hasComponent(typename) && match;
    }

    return match;
  }

  update() {
    this.onBeforeUpdate();
    this.entities.forEach(entity => this.onUpdate(entity));
    this.onAfterUpdate();
  }

  onBeforeUpdate() {
    // virtual method called during before update phase !
  }

  onUpdate(entity) {
    // virtual method called during update phase !
  }

  onAfterUpdate() {
    // virtual method called during after update phase !
  }
}

module.exports.ECSSystem = ECSSystem;
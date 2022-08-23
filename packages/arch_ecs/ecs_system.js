/**
 * The ECSSystem class is abstract class for all logic part of your game.
 */
class ECSSystem {
  constructor() {
    this.entities = [];
    this.requiredComponentTypenames = [];
  }

  /**
   * Bind the entity reference.
   * Nota bene: throw if system has already entity.
   * @param {ECSEntity} entity - The entity reference.
   */
  bindEntity(entity) {
    if (this.entities.indexOf(entity) != -1) {
      throw new Error('ECSSystem::bindEntity(): Entity already exist in this system');
    }

    this.entities.push(entity);
  }

  /**
   * Unbind the entity reference.
   * Nota bene: throw if system has not entity.
   * @param {ECSEntity} entity - The entity reference.
   */
  unbindEntity(entity) {
    if (this.entities.indexOf(entity) == -1) {
      throw new Error('ECSSystem::unbindEntity(): Entity not exist in this system');
    }

    this.entities.splice(this.entities.indexOf(entity), 1);
  }

  /**
   * Check if system has the entity reference.
   * @param {ECSEntity} entity - The entity reference.
   * @return {boolean} Return true if system has the entity.
   */
  hasEntity(entity) {
    return this.entities.indexOf(entity) != -1;
  }

  /**
   * Add component requirement.
   * This is used by manager to dispatch entities on matching system.
   * Nota bene: throw if system has already component type name.
   * @param {string} typename - The component type name required by system.
   */
  addRequiredComponentTypename(typename) {
    if (this.requiredComponentTypenames.indexOf(typename) != -1) {
      throw new Error('ECSSystem::addRequiredComponentTypename(): Required typename already set in this system');
    }

    this.requiredComponentTypenames.push(typename);
  }

  /**
   * Check if entity match the required components.
   * This is used by manager to dispatch entities on matching system.
   * @return {boolean} Return true if entity match with the required component list.
   */
  isMatchingEntity(entity) {
    let match = true;
    for (let typename of this.requiredComponentTypenames) {
      match = entity.hasComponent(typename) && match;
    }

    return match;
  }

  /**
   * The update loop.
   */
  update() {
    this.onBeforeUpdate();
    this.entities.forEach(entity => this.onUpdate(entity));
    this.onAfterUpdate();
  }

  /**
   * Virtual method called during before update phase !
   */
  onBeforeUpdate() {}

  /**
   * Virtual method called during update phase !
   * @param {ECSEntity} entity - The current updated entity.
   */
  onUpdate(entity) {}

  /**
   * Virtual method called during after update phase !
   */
  onAfterUpdate() {}
}

module.exports.ECSSystem = ECSSystem;

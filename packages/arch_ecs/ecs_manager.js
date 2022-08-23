/**
 * The ECSManager class make the join between entities and systems.
 */
class ECSManager {
  constructor() {
    this.entities = [];
    this.systems = [];
    this.entitiesChanged = [];
  }

  /**
   * Get entity by id. Nota bene: throw if manager has not entity.
   * Nota bene: throw if manager has not entity.
   * @param {string} id - The entity id.
   * @return {ECSEntity} The matching entity.
   */
  getEntityFromId(id) {
    let found = this.entities.find(e => e.id == id);
    if (!found) {
      throw new Error('ECSManager::getEntityFromId(): Entity not found');
    }

    return found;
  }

  /**
   * Add entity.
   * Push the entity and update all entity system list.
   * @param {ECSEntity} entity - The entity to add.
   */
  addEntity(entity) {
    this.entities.push(entity);
    entity.onChanged = () => this.entitiesChanged.push(entity);

    for (let system of this.systems) {
      if (system.isMatchingEntity(entity)) {
        system.bindEntity(entity);
      }
    }
  }

  /**
   * Remove entity.
   * Remove entity and update all system entity list.
   * Nota bene: throw if manager has not entity.
   * @param {ECSEntity} entity - The entity to remove.
   */
  removeEntity(entity) {
    let found = this.entities.find(e => e == entity);
    if (!found) {
      throw new Error('ECSManager::removeEntity(): Entity not found');
    }

    this.entities.splice(this.entities.indexOf(entity), 1);
    entity.onChanged = () => {};

    for (let system of this.systems) {
      if (system.hasEntity(entity)) {
        system.unbindEntity(entity);
      }
    }
  }

  /**
   * Check if manager has the entity (tested by reference).
   * @param {ECSEntity} entity - The entity to check.
   * @return {boolean} Return true if manager has entity.
   */
  hasEntity(entity) {
    return this.entities.find(e => e == entity);
  }

  /**
   * Add system.
   * @param {ECSSystem} system - The system to add.
   */
  addSystem(system) {
    this.systems.push(system);
  }

  /**
   * The update loop.
   * Update all systems.
   */
  update() {
    for (let system of this.systems) {
      for (let entity of this.entitiesChanged) {
        let matching = system.isMatchingEntity(entity);
        if (matching && !system.hasEntity(entity)) {
          system.bindEntity(entity);
        }
        else if (!matching && system.hasEntity(entity)) {
          system.unbindEntity(entity);
        }
      }

      system.update();
    }

    this.entitiesChanged = [];
  }
}

module.exports.ECSManager = ECSManager;

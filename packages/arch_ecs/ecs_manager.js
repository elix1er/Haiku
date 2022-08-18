class ECSManager {
  constructor() {
    this.entities = [];
    this.systems = [];
    this.entitiesChanged = [];
  }

  getEntityFromId(id) {
    let found = this.entities.find(e => e.id == id);
    if (!found) {
      throw new Error('ECSManager::getEntityFromId(): Entity not found');
    }

    return found;
  }

  addEntity(entity) {
    this.entities.push(entity);
    entity.onChanged = () => this.entitiesChanged.push(entity);

    for (let system of this.systems) {
      if (system.isMatchingEntity(entity)) {
        system.bindEntity(entity);
      }
    }
  }

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

  hasEntity(entity) {
    return this.entities.find(e => e == entity);
  }

  addSystem(system) {
    this.systems.push(system);
  }

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
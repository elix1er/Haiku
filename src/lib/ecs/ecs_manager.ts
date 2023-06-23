import { ECSComponent } from './ecs_component';
import { ECSSystem } from './ecs_system';

class ECSManager {
  entityIndex: number;
  entities: Map<number, Array<ECSComponent>>;
  systems: Array<ECSSystem>;

  constructor() {
    this.entityIndex = 0;
    this.entities = new Map<number, Array<ECSComponent>>();
    this.systems = [];
  }

  update(ts: number): void {
    for (const system of this.systems) {
      system.update(ts);
    }
  }

  setup(systems: Array<ECSSystem>): void {
    this.entities.clear();
    this.systems = systems;
  }

  createEntity(): number {
    this.entities.set(this.entityIndex, []);
    return this.entityIndex++;
  }

  getEntity(index: number): Array<ECSComponent> {
    const found = this.entities.get(index);
    if (!found) {
      throw new Error('ECSManager::getEntity(): Entity not found');
    }

    return found;
  }

  removeEntity(index: number): void {
    const found = this.entities.get(index);
    if (!found) {
      throw new Error('ECSManager::removeEntity(): Entity not found');
    }

    this.entities.delete(index);

    for (const system of this.systems) {
      if (system.hasEntity(index)) {
        system.unbindEntity(index);
      }
    }
  }

  hasEntity(index: number): boolean {
    return this.entities.has(index);
  }

  addComponent(index: number, component: ECSComponent): void {
    const entity = this.entities.get(index);
    if (!entity) {
      throw new Error('ECSManager::addComponent(): Entity not found');
    }

    const found = entity.find(c => c.getTypename() == component.getTypename());
    if (found) {
      throw new Error('ECSEntity::addComponent(): Entity already has ' + component.typename);
    }

    entity.push(component);

    for (const system of this.systems) {
      if (system.isMatchingComponentRequirements(entity) && !system.hasEntity(index)) {
        system.bindEntity(index);
      }
    }
  }

  removeComponent(index: number, typename: string): void {
    const entity = this.entities.get(index);
    if (!entity) {
      throw new Error('ECSManager::removeComponent(): Entity not found');
    }

    const found = entity.find(c => c.getTypename() == typename);
    if (!found) {
      throw new Error('ECSManager::removeComponent(): Entity has not ' + typename);
    }

    entity.splice(entity.indexOf(found), 1);

    for (const system of this.systems) {
      if (!system.isMatchingComponentRequirements(entity) && system.hasEntity(index)) {
        system.unbindEntity(index);
      }
    }
  }

  getComponent(index: number, typename: string): ECSComponent {
    const entity = this.entities.get(index);
    if (!entity) {
      throw new Error('ECSManager::getComponent(): Entity not found');
    }

    const found = entity.find(c => c.getTypename() == typename);
    if (!found) {
      throw new Error('ECSManager::getComponent(): Entity has not ' + typename);
    }

    return found;
  }

  hasComponent(index: number, typename: string): boolean {
    const entity = this.entities.get(index);
    if (!entity) {
      throw new Error('ECSManager::hasComponent(): Entity not found');
    }

    const found = entity.find(c => c.getTypename() == typename);
    return found ? true : false;
  }
}

const ecsManager = new ECSManager();
export { ECSManager };
export { ecsManager };
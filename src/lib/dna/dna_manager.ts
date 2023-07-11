import { eventManager } from '../core/event_manager';
import { inputManager } from '../input/input_manager';
import { DNAComponent } from './dna_component';
import { DNASystem } from './dna_system';

class DNAManager {
  entityIndex: number;
  entities: Map<number, Map<string, DNAComponent>>;
  systems: Array<DNASystem>;

  constructor() {
    this.entityIndex = 0;
    this.entities = new Map<number, Map<string, DNAComponent>>();
    this.systems = [];

    eventManager.subscribe(inputManager, 'E_ACTION', this, (data: any) => {
      for (let system of this.systems) {
        system.action(data.actionId);
      }
    });

    eventManager.subscribe(inputManager, 'E_ACTION_ONCE', this, (data: any) => {
      for (let system of this.systems) {
        system.actionOnce(data.actionId);
      }
    });
  }

  update(ts: number): void {
    for (const system of this.systems) {
      system.update(ts);
    }
  }

  draw(): void {
    for (const system of this.systems) {
      system.draw();
    }
  }

  setup(systems: Array<DNASystem>): void {
    this.entities.clear();
    this.systems = systems;
  }

  createEntity(): number {
    this.entities.set(this.entityIndex, new Map<string, DNAComponent>());
    return this.entityIndex++;
  }

  getEntity(index: number): Map<string, DNAComponent> {
    const found = this.entities.get(index);
    if (!found) {
      throw new Error('DNAManager::getEntity(): Entity not found');
    }

    return found;
  }

  removeEntity(index: number): void {
    const found = this.entities.get(index);
    if (!found) {
      throw new Error('DNAManager::removeEntity(): Entity not found');
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

  findEntities(componentTypeName: string): Array<number> {
    const entities = Array<number>();

    for (let [entity, components] of this.entities) {
      if (components.has(componentTypeName)) {
        entities.push(entity);
      }
    }

    return entities;
  }

  findEntity(componentTypeName: string): number {
    for (let [entity, components] of this.entities) {
      if (components.has(componentTypeName)) {
        return entity;
      }
    }

    return -1;
  }

  addComponent(entity: number, component: DNAComponent): void {
    const components = this.entities.get(entity);
    if (!components) {
      throw new Error('DNAManager::addComponent(): Entity not found');
    }

    const found = components.has(component.getTypename());
    if (found) {
      throw new Error('ECSEntity::addComponent(): Entity already has ' + component.getTypename());
    }

    components.set(component.getTypename(), component);

    for (const system of this.systems) {
      if (system.isMatchingComponentRequirements(components.values()) && !system.hasEntity(entity)) {
        system.bindEntity(entity);
      }
    }
  }

  removeComponent(entity: number, typename: string): void {
    const components = this.entities.get(entity);
    if (!components) {
      throw new Error('DNAManager::removeComponent(): Entity not found');
    }

    const found = components.has(typename);
    if (!found) {
      throw new Error('DNAManager::removeComponent(): Entity has not ' + typename);
    }

    components.delete(typename);

    for (const system of this.systems) {
      if (!system.isMatchingComponentRequirements(components.values()) && system.hasEntity(entity)) {
        system.unbindEntity(entity);
      }
    }
  }

  removeComponentIfExist(entity: number, typename: string): boolean {
    if (this.hasComponent(entity, typename)) {
      this.removeComponent(entity, typename);
      return true;
    }

    return false;
  }
  
  getComponent(entity: number, typename: string): DNAComponent {
    const components = this.entities.get(entity);
    if (!components) {
      throw new Error('DNAManager::getComponent(): Entity not found');
    }

    const found = components.get(typename);
    if (!found) {
      throw new Error('DNAManager::getComponent(): Entity has not ' + typename);
    }

    return found;
  }

  hasComponent(entity: number, typename: string): boolean {
    const components = this.entities.get(entity);
    if (!components) {
      throw new Error('DNAManager::hasComponent(): Entity not found');
    }

    return components.has(typename);
  }
}

const dnaManager = new DNAManager();
export { DNAManager };
export { dnaManager };

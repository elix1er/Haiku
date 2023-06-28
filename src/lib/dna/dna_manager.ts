import { eventManager } from '../core/event_manager';
import { inputManager } from '../input/input_manager';
import { DNAComponent } from './dna_component';
import { DNASystem } from './dna_system';

class DNAManager {
  entityIndex: number;
  entities: Map<number, Array<DNAComponent>>;
  systems: Array<DNASystem>;

  constructor() {
    this.entityIndex = 0;
    this.entities = new Map<number, Array<DNAComponent>>();
    this.systems = [];

    eventManager.subscribe(inputManager, 'E_ACTION', this, (data: any) => {
      for (let system of this.systems) {
        system.onAction(data.actionId);
      }
    });

    eventManager.subscribe(inputManager, 'E_ACTION_ONCE', this, (data: any) => {
      for (let system of this.systems) {
        system.onActionOnce(data.actionId);
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
    this.entities.set(this.entityIndex, []);
    return this.entityIndex++;
  }

  getEntity(index: number): Array<DNAComponent> {
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

  addComponent(index: number, component: DNAComponent): void {
    const entity = this.entities.get(index);
    if (!entity) {
      throw new Error('DNAManager::addComponent(): Entity not found');
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
      throw new Error('DNAManager::removeComponent(): Entity not found');
    }

    const found = entity.find(c => c.getTypename() == typename);
    if (!found) {
      throw new Error('DNAManager::removeComponent(): Entity has not ' + typename);
    }

    entity.splice(entity.indexOf(found), 1);

    for (const system of this.systems) {
      if (!system.isMatchingComponentRequirements(entity) && system.hasEntity(index)) {
        system.unbindEntity(index);
      }
    }
  }

  getComponent(index: number, typename: string): DNAComponent {
    const entity = this.entities.get(index);
    if (!entity) {
      throw new Error('DNAManager::getComponent(): Entity not found');
    }

    const found = entity.find(c => c.getTypename() == typename);
    if (!found) {
      throw new Error('DNAManager::getComponent(): Entity has not ' + typename);
    }

    return found;
  }

  hasComponent(index: number, typename: string): boolean {
    const entity = this.entities.get(index);
    if (!entity) {
      throw new Error('DNAManager::hasComponent(): Entity not found');
    }

    const found = entity.find(c => c.getTypename() == typename);
    return found ? true : false;
  }
}

const dnaManager = new DNAManager();
export { DNAManager };
export { dnaManager };

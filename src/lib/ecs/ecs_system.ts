import { ECSComponent } from "./ecs_component";

class ECSSystem {
  entities: Array<number>;
  requiredComponentTypenames: Array<string>;

  constructor() {
    this.entities = [];
    this.requiredComponentTypenames = [];
  }

  update(ts: number): void {
    this.onBeforeUpdate(ts);

    for (const entity of this.entities) {
      this.onUpdate(ts, entity);
    }

    this.onAfterUpdate(ts);
  }

  bindEntity(index: number): void {
    if (this.entities.indexOf(index) != -1) {
      throw new Error('ECSSystem::bindEntity(): Entity already exist in this system');
    }

    this.entities.push(index);
  }

  unbindEntity(index: number): void {
    if (this.entities.indexOf(index) == -1) {
      throw new Error('ECSSystem::unbindEntity(): Entity not exist in this system');
    }

    this.entities.splice(this.entities.indexOf(index), 1);
  }

  hasEntity(index: number): boolean {
    return this.entities.indexOf(index) != -1;
  }

  addRequiredComponentTypename(typename: string): void {
    if (this.requiredComponentTypenames.indexOf(typename) != -1) {
      throw new Error('ECSSystem::addRequiredComponentTypename(): Required typename already set in this system');
    }

    this.requiredComponentTypenames.push(typename);
  }

  isMatchingComponentRequirements(components: Array<ECSComponent>): boolean {
    for (const typename of this.requiredComponentTypenames) {
      if (!components.find(c => c.getTypename() == typename)) {
        return false;
      }
    }

    return true;
  }

  onBeforeUpdate(ts: number): void {
    // virtual method called during before update phase !
  }

  onUpdate(ts:number, entity: number): void {
    // virtual method called during update phase !
  }

  onAfterUpdate(ts: number): void {
    // virtual method called during after update phase !
  }
}

export { ECSSystem };
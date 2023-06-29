import { DNAComponent } from './dna_component';

class DNASystem {
  entities: Set<number>;
  requiredComponentTypenames: Set<string>;

  constructor() {
    this.entities = new Set<number>();
    this.requiredComponentTypenames = new Set<string>();
  }

  update(ts: number): void {
    this.onBeforeUpdate(ts);

    for (const entity of this.entities) {
      this.onEntityUpdate(ts, entity);
    }

    this.onAfterUpdate(ts);
  }

  draw(): void {
    for (const entity of this.entities) {
      this.onEntityDraw(entity);
    }
  }

  action(actionId: string): void {
    for (const entity of this.entities) {
      this.onAction(actionId, entity);
    }
  }

  actionOnce(actionId: string): void {
    for (const entity of this.entities) {
      this.onActionOnce(actionId, entity);
    }
  }

  bindEntity(entity: number): void {
    if (this.entities.has(entity)) {
      throw new Error('DNASystem::bindEntity(): Entity already exist in this system');
    }

    this.onEntityBind(entity);
    this.entities.add(entity);
  }

  unbindEntity(entity: number): void {
    if (!this.entities.has(entity)) {
      throw new Error('DNASystem::unbindEntity(): Entity not exist in this system');
    }

    this.onEntityUnbind(entity);
    this.entities.delete(entity);
  }

  hasEntity(entity: number): boolean {
    return this.entities.has(entity);
  }

  addRequiredComponentTypename(typename: string): void {
    if (this.requiredComponentTypenames.has(typename)) {
      throw new Error('DNASystem::addRequiredComponentTypename(): Required typename already set in this system');
    }

    this.requiredComponentTypenames.add(typename);
  }

  isMatchingComponentRequirements(components: IterableIterator<DNAComponent>): boolean {
    let numRequiredComponents = this.requiredComponentTypenames.size;
    let numMatchingComponents = 0;

    for (const component of components) {
      if (this.requiredComponentTypenames.has(component.getTypename())) {
        numMatchingComponents++;
      }
    }

    return numMatchingComponents == numRequiredComponents;
  }

  onAction(actionId: string, entity: number): void {
    // virtual method called when action occured !
  }

  onActionOnce(actionId: string, entity: number): void {
    // virtual method called when action occured once !
  }

  onBeforeUpdate(ts: number): void {
    // virtual method called during before update phase !
  }

  onEntityUpdate(ts:number, entity: number): void {
    // virtual method called during update phase !
  }

  onAfterUpdate(ts: number): void {
    // virtual method called during after update phase !
  }

  onEntityDraw(entity: number): void {
    // virtual method called during draw phase !
  }

  onEntityBind(entity: number): void {
    // virtual method called during entity binding !
  }

  onEntityUnbind(entity: number): void {
    // virtual method called during entity unbinding !
  }
}

export { DNASystem };
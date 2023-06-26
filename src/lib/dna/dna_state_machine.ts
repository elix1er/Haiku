import { DNAState } from './dna_state';

const ON_COMPLETE_ACTION = 'ON_COMPLETE_ACTION';

class DNAStateMachine {
  states: DNAState[];
  current: DNAState | null;
  timestamp: number;

  constructor() {
    this.states = [];
    this.current = null;
    this.timestamp = 0;
  }

  setTime(time: number): void {
    this.timestamp = time;
    const state = this.getCurrentState();
    if (state == null || state.onCompleteAction == null) {
      return;
    }

    const duration1 = state.duration || 0;
    const duration2 = state.lockDuration || 0;
    const duration = Math.max(duration1, duration2);

    if (this.getElapsedTime() < duration) {
      return;
    }

    this.emit("ON_COMPLETE_ACTION", state.onCompleteAction);
  }

  getTime(): number {
    return this.timestamp;
  }

  addState(state: DNAState): void {
    this.states.push(state);
  }

  removeState(state: DNAState): void {
    this.states.splice(this.states.indexOf(state), 1);
  }

  reset(): void {
    this.current = null;
    this.states = [];
  }

  hasState(id: string): boolean {
    const found = this.states.find(state => state.id == id);
    return found ? true : false;
  }

  getStateById(id: string): DNAState {
    const found = this.states.find(state => state.id == id);
    if (!found) {
      throw new Error('DNAStateMachine::getStateById(): State not found');
    }

    return found;
  }

  getElapsedTime(): number {
    const current = this.getCurrentState();
    return current == null ? -1 : this.timestamp - current.startTime;
  }

  public dispatch(action: string): void {
    const current = this.getCurrentState();
    if (current == null) {
      return;
    }

    const elapsed = this.timestamp - current.startTime;
    if (elapsed < current.lockDuration) {
      return;
    }

    const currentAction = current.actions.find(cur => cur.name === action) || null;
    if (currentAction === null) {
      return;
    }

    const target = this.getStateById(currentAction.target);

    if (target !== current) {
      this.setCurrentState(target);
      this.emit("CHANGE_STATE", target);
    }
  }

  getCurrentState(): DNAState | null {
    return this.current ?? null;
  }

  setCurrentState(state: DNAState): void {
    if (!this.hasState(state.id)) {
      this.addState(state);
    }

    state.startTime = this.timestamp;
    this.current = state;
  }

  getStates(): Array<DNAState> {
    return this.states;
  }
}

export { DNAStateMachine };
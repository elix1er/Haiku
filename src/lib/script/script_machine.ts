interface JSCBlock {
  id: string;
  description: string;
  calls: Array<JSCBlockCall>;
}

interface JSCBlockCall {
  commandName: string;
  commandArgs: Array<any>;
}

class ScriptMachine {
  blocks: Array<JSCBlock>;
  commandRegister: Map<string, Function>;
  enabled: boolean;
  currentBlockId: string;
  currentCallIndex: number;
  onBeforeBlockExec: (block: JSCBlock) => void;
  onAfterBlockExec: (block: JSCBlock) => void;
  onBeforeCommandExec: (command: Function) => void;
  onAfterCommandExec: (command: Function) => void;

  constructor() {
    this.blocks = [];
    this.commandRegister = new Map<string, Function>();
    this.enabled = true;
    this.currentBlockId = '';
    this.currentCallIndex = 0;
    this.onBeforeBlockExec = () => { };
    this.onAfterBlockExec = () => { };
    this.onBeforeCommandExec = () => { };
    this.onAfterCommandExec = () => { };
  }

  update(ts: number): void {
    if (!this.enabled) {
      return;
    }

    const currentBlock = this.blocks.find(block => block.id == this.currentBlockId);
    if (!currentBlock) {
      return;
    }

    if (this.currentCallIndex == currentBlock.calls.length) {
      this.onAfterBlockExec(currentBlock);
      this.currentBlockId = '';
      this.currentCallIndex = 0;
      return;
    }

    if (this.currentCallIndex == 0) {
      this.onBeforeBlockExec(currentBlock);
    }

    const currentCall = currentBlock.calls[this.currentCallIndex];
    const jumpto = this.runCommand(currentCall.commandName, currentCall.commandArgs);
    if (typeof jumpto === 'string') {
      this.currentBlockId = jumpto;
      this.currentCallIndex = 0;
      return;
    }

    if (this.currentCallIndex < currentBlock.calls.length) {
      this.currentCallIndex++;
    }
  }

  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    this.blocks = [];
    for (const obj of json) {
      const block: JSCBlock = { id: obj['Id'], description: obj['Description'], calls: [] };
      for (const objCall of obj['Calls']) {
        block.calls.push({
          commandName: objCall['Name'],
          commandArgs: objCall['Args']
        });
      }

      this.blocks.push(block);
    }
  }

  registerCommand(key: string, commandFunc: Function) {
    if (this.commandRegister.has(key)) {
      throw new Error('ScriptMachine::registerCommand: key already exist !')
    }

    this.commandRegister.set(key, commandFunc);
  }

  runCommand(key: string, args: Array<any> = []): string | undefined {
    const command = this.commandRegister.get(key);
    if (!command) {
      throw new Error('ScriptMachine::runCommand: try to call an not existant command ' + key + ' !');
    }

    this.onBeforeCommandExec(command);
    const jumpto = command.call(this, ...args);
    this.onAfterCommandExec(command);
    return jumpto;
  }

  clearCommandRegister(): void {
    this.commandRegister.clear();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  jump(blockId: string) {
    this.currentBlockId = blockId;
    this.currentCallIndex = 0;
  }
}

export { ScriptMachine };
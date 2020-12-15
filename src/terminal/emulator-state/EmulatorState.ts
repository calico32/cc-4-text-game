import { Command, OutputRecord } from '../types';

export class EmulatorState {
  history: string[];
  outputs: OutputRecord[];
  commands: Map<string, Command>;

  constructor(opts: {
    history?: string[];
    outputs?: OutputRecord[];
    commands: Map<string, Command>;
  }) {
    this.history = opts.history ?? [];
    this.outputs = opts.outputs ?? [];
    this.commands = opts.commands ?? new Map();
  }
}

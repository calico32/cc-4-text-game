import { EmulatorState } from './emulator-state';

export interface TermPlugin {
  onExecuteStarted(state: EmulatorState, str?: string): void;
  onExecuteCompleted(state: EmulatorState): void;
}

export type OutputType = 'TEXT_OUTPUT' | 'TEXT_ERROR_OUTPUT' | 'HEADER_OUTPUT';

export interface OutputRecord {
  type: OutputType;
  content: any;
}

export interface TermError {
  source: string;
  type: string;
  message: string;
}

export type TermErrorType = 'COMMAND_NOT_FOUND' | 'UNEXPECTED_COMMAND_FAILURE';

export type Command = (state: EmulatorState, args: string[]) => CommandOutput;

export type CommandMap = Map<string, Command>;

export interface CommandOutput {
  output?: OutputRecord[] | OutputRecord;
  state?: EmulatorState;
}

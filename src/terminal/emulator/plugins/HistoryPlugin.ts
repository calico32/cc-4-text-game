import { EmulatorState } from '../../emulator-state';
import { TermPlugin } from '../../types';

//   event.preventDefault();
//   if (history.length - (this.index + 1) < 0) return;
//   if (this.index == 0) savedTempValue = inputRef.current.value;
//   this.index++;
//   inputRef.current.value = history[history.length - this.index].input;
//   break;
// case 'ArrowDown':
//   event.preventDefault();
//   if (this.index > 0) this.index--;
//   if (this.index == 0) return (inputRef.current.value = savedTempValue);
//   inputRef.current.value = history[history.length - this.index].input;

export class HistoryPlugin implements TermPlugin {
  history: string[];
  index = 0;
  savedValue?: string;
  constructor(state: EmulatorState) {
    this.history = state.history;
  }

  // Plugin contract
  onExecuteStarted(state: EmulatorState, str: string): void {
    // no-op
  }

  // Plugin contract
  onExecuteCompleted(state: EmulatorState): void {
    this.history = state.history;
    this.index = 0;
  }

  // Plugin API
  completeUp(current: string): string {
    if (this.history.length - (this.index + 1) < 0) return current;
    if (this.index == 0) this.savedValue = current;
    this.index++;
    return this.history[this.history.length - this.index];
  }

  completeDown(): string {
    if (this.index > 0) this.index--;
    if (this.index == 0) return this.savedValue ?? '';
    return this.history[this.history.length - this.index];
  }
}

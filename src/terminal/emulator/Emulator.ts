import { EmulatorState } from '../emulator-state';
import { TermOutput } from '../output';
import { TermPlugin } from '../types';
import { suggestCommands } from './auto-complete';
import * as CommandRunner from './command-runner';

export class Emulator {
  /**
   * Completes user input if there is one, and only one, suggestion.
   *
   * If there are no suggestions or more than one suggestion, the original
   * user input will be returned.
   * @param  {EmulatorState} state      emulator state
   * @param  {string}        partialStr partial user input to the emulator
   * @return {string}                   completed user input when one suggest (or, otherwsie, the original input)
   */
  autocomplete(state: EmulatorState, partialStr: string): string {
    const suggestions = this.suggest(state, partialStr);

    if (suggestions.length !== 1) {
      return partialStr;
    }

    const strParts = partialStr.split(' ');
    const autocompletedText = suggestions[0];

    strParts[strParts.length - 1] = autocompletedText;

    return strParts.join(' ');
  }

  /**
   * Suggest what the user will type next
   * @param  {EmulatorState} state      emulator state
   * @param  {string}        partialStr partial user input of a command
   * @return {array}                    list of possible text suggestions
   */
  suggest(state: EmulatorState, partialStr: string): string[] {
    partialStr = partialStr.replace(/^\s+/g, '');

    const lastPartialChar = partialStr.slice(-1);
    const isTypingNewPart = lastPartialChar === ' ';

    const strParts = partialStr.trim().split(' ');
    const cmdName = strParts[0];

    if (!isTypingNewPart && strParts.length === 1) {
      return suggestCommands(state.commands, cmdName);
    }

    return [];
  }

  /**
   * Runs emulator command
   * @param state emulator state before running command
   * @param str command string to execute
   * @param plugins list of plugins to notify while running the command
   * @return updated emulator state after running command
   */
  execute(state: EmulatorState, str: string, plugins: TermPlugin[] = []): EmulatorState {
    plugins.forEach(p => p.onExecuteStarted(state));

    state.outputs.push(TermOutput.header(str));

    if (str.trim() !== '') {
      state.history.push(str);

      const [name, ...args] = str.trim().replace(/\s\s+/g, ' ').split(/\s/);

      const response = CommandRunner.run(state.commands, name, [state, args] as const);

      response.state && (state = response.state);
      if (response.output) {
        if (Array.isArray(response.output)) state.outputs.push(...response.output);
        else state.outputs.push(response.output);
      }
    }

    plugins.forEach(p => p.onExecuteCompleted(state));

    return state;
  }
}

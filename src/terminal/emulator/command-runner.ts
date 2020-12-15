import { EmulatorState } from '../emulator-state';
import { TermOutput } from '../output';
import { CommandMap, CommandOutput } from '../types';
import { makeError } from './emulator-error';

/**
 * Runs a command and returns an object containing either:
 * - outputs from running the command, or
 * - new emulator state after running the command, or
 * - new emulator state and output after running the command
 *
 * The form of the object from this function is as follows:
 * {
 *   outputs: [optional array of output records]
 *   output: [optional single output record]
 *   state: [optional Map]
 * }
 * @param commands command mapping from emulator state
 * @param name name of command to run
 * @param args commands to provide to the command function
 * @param errorStr a default string to be displayed if no command is found
 * @return outputs and/or new state of the emulator
 */
export const run = (
  commands: CommandMap,
  name: string,
  args: readonly [EmulatorState, string[]]
): CommandOutput => {
  const notFoundCallback = () => ({
    output: TermOutput.error(makeError('COMMAND_NOT_FOUND', name)),
  });

  if (!commands.has(name)) return notFoundCallback();

  const command = commands.get(name);

  try {
    return command!(...args);
  } catch (err) {
    return {
      output: TermOutput.error(makeError('UNEXPECTED_COMMAND_FAILURE', err.message)),
    };
  }
};

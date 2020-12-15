import * as GlobUtil from '../glob';
import { CommandMap } from '../types';

/**
 * Suggest command names
 * @param  {Map}    commands     command mapping
 * @param  {string} partialStr     partial user input of a command
 * @return {array}                 list of possible text suggestions
 */
export const suggestCommands = (commands: CommandMap, partialStr: string): Array<any> => {
  return [...GlobUtil.globSeq([...commands.keys()], `${partialStr}*`)];
};

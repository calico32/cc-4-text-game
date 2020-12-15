import { Command, CommandMap } from '../types';

/**
 * Links a command name to a function
 * @param  {Object} [commandMapping={}] default command map
 * @return {Map}                        command mapping
 */
export const create = (
  commandMapping: {
    [key: string]: Command;
  } = {}
): CommandMap => new Map(Object.entries(commandMapping));

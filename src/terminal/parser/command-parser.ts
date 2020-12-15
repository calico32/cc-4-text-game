const removeExcessWhiteSpace = (str: string) => str.trim().replace(/\s\s+/g, ' ');

const toCommandParts = (command: string) => removeExcessWhiteSpace(command).split(/\s/);

/**
 * Creates a list of commands split into the command name and arguments
 * @param  {string} commands command input
 * @return {array}           list of parsed command
 */
// export const parseCommands = (commands: string): { name: string; args: string[] }[] => {
//   return commands
//     .split(/&&|;/) // split command delimiters: `&&` and `;`
//     .map(command => toCommandParts(command))
//     .map(([name, ...args]) => ({ name, args }));
// };

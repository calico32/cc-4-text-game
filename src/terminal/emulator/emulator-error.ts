import { TermError, TermErrorType } from '../types';

const displayNames: Record<TermErrorType, string> = {
  COMMAND_NOT_FOUND: 'Error: Unknown command',
  UNEXPECTED_COMMAND_FAILURE: 'Error',
};
export const makeError = (type: TermErrorType, message = ''): TermError => {
  return {
    source: '',
    type: displayNames[type],
    message,
  };
};

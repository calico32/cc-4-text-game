import { OutputRecord, TermError } from './types';

export class TermOutput {
  static header(content?: string): OutputRecord {
    return {
      type: 'HEADER_OUTPUT',
      content: content ?? '',
    };
  }
  static text(content?: string): OutputRecord {
    return {
      type: 'TEXT_OUTPUT',
      content: content ?? '',
    };
  }
  static error(err: TermError): OutputRecord {
    return {
      type: 'TEXT_ERROR_OUTPUT',
      content: `${err.source ? err.source + ': ' : ''}${err.type}${
        err.message ? ': ' + err.message : ''
      }`,
    };
  }
}

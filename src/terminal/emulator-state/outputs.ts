import { OutputRecord } from '../types';

/**
 * Stores outputs from the emulator (e.g. text to display after running a command)
 * @param  {Array}  [outputs=[]] Previous outputs
 * @return {List}               List of outputs objects
 */
export const create = (outputs: OutputRecord[] = []): OutputRecord[] => {
  return [...outputs];
};

export const addRecord = (outputs: OutputRecord[], outputRecord: OutputRecord): OutputRecord[] => {
  outputs.push(outputRecord);
  return outputs;
};

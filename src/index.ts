import * as game from './game';
import { flushPrompt, getPrompt } from './prompt';
import { Emulator, EmulatorState, HistoryKeyboardPlugin, OutputType } from './terminal';

import './index.css';

const input = document.getElementById('input') as HTMLInputElement;
const output = document.getElementById('output-wrapper') as HTMLElement;

const out = (className: string, textContent: string) => {
  const div = document.createElement('div');

  div.className = className;
  div.appendChild(document.createTextNode(textContent));

  return div;
};

const outputToHTMLNode: Record<OutputType, (content) => HTMLDivElement> = {
  TEXT_OUTPUT: content => out('text-output', content),
  TEXT_ERROR_OUTPUT: content => out('error-output', content),
  HEADER_OUTPUT: content => out('header-output', `${getPrompt()}${content}`),
};

const emulator = new Emulator();

let state = new EmulatorState({ commands: game.commands, outputs: game.startText });
const history = new HistoryKeyboardPlugin(state);
let prevOutputs = 0;

const updateDisplay = () => {
  if (state.outputs.length > prevOutputs) {
    state.outputs
      .slice(prevOutputs)
      .flatMap(o => {
        if ((o.type === 'HEADER_OUTPUT' && o.content === 'clear') || o.content === '#CLEAR#') {
          output.innerHTML = '';
          return [];
        }
        return outputToHTMLNode[o.type](o.content);
      })
      .forEach(o => output.append(o));

    flushPrompt();
    window.scrollTo(0, document.body.scrollHeight);
    prevOutputs = state.outputs.length;
  }
};

document.addEventListener('keydown', event => {
  if (document.activeElement !== input) input.focus();
});

input.addEventListener('keydown', event => {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    input.value = history.completeUp(input.value);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    input.value = history.completeDown();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    const autoCompletionStr = emulator.autocomplete(state, input.value);
    input.value = autoCompletionStr;
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const command = input.value;
    state = emulator.execute(state, command, [history, game.stopwatchPLugin]);
    updateDisplay();
    input.value = '';
  }
});

updateDisplay();

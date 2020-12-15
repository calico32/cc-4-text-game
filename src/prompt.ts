document.querySelector('#app')!.innerHTML = `
  <div id="output-wrapper"></div>
  <div class="input-wrapper">
    <span id="prompt">&gt;&nbsp;</span>
    <input id="input" type="text" autofocus autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
  </div>
`;

let termPrompt: string;
let promptBuffer: string;

const fetchPrompt = () => {
  const escaped = document.querySelector('#prompt')!.innerHTML ?? '';
  return new DOMParser().parseFromString(escaped, 'text/html').documentElement.textContent ?? '';
};

export const flushPrompt = (): void => {
  document.querySelector('#prompt')!.innerHTML = promptBuffer;
  termPrompt = fetchPrompt();
};

export const setPrompt = (newPrompt: string): void => {
  promptBuffer = newPrompt;
};

export const getPrompt = (): string => {
  if (!termPrompt) termPrompt = fetchPrompt();
  return termPrompt;
};

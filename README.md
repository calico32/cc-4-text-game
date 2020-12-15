# text game

text-based game with 3 sub-puzzles

live at <https://puzzle.wiisportsresorts.dev>.

## extra features

- web app: why not?
- shell-like history: press up and down to traverse through time
- win confetti
- speedrun clock
- puzzles:
  - lights out: a game where you have to turn all the lights off
    - has moves counter
    - awards points (gold) based on moves taken to finish
  - tic tac toe: pretty self-explanatory
    - blind AI
    - 20 gold if win, 8 if tie
  - word unscramble: unscramble le word
    - 5 words of increasing difficulty
    - can skip at the cost of 5 gold

## technologies

no react or scss this time!

- **snowpack** as bundler (much faster than webpack, it's scary)
- **typescript** as language
- **postcss** as css preprocessor
- **tailwindcss** but i don't really use it at all

i yoinked the web terminal library from <https://github.com/rohanchandra/javascript-terminal> but removed the unnecessary stuff (environ vars, fs, autocomplete) and rewrote it in modern typescript (at `src/terminal`).

## running locally

Yarn 1 because i forgot yarn 2 existed

- `yarn`
- `yarn dev` for dev server
- `yarn build` for production bundle
  - install `http-server` (npm package) for testing production server

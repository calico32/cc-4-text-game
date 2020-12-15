import ConfettiGenerator from 'confetti-js';

import { setPrompt } from './prompt';
import { Stopwatch, StopwatchPlugin } from './stopwatch';
import { TermOutput } from './terminal';
import { create as createCommands } from './terminal/emulator-state/command-mapping';
import { Command, OutputRecord } from './terminal/types';

const confetti = new ConfettiGenerator({
  target: 'confetti',
  max: '250',
  size: '1',
  animate: true,
  props: ['circle', 'square', 'triangle', 'line'],
  colors: [
    [165, 104, 246],
    [230, 61, 135],
    [0, 199, 228],
    [253, 214, 126],
  ],
  clock: '40',
  rotate: true,
  start_from_edge: true,
  respawn: true,
});

const stopwatch = new Stopwatch();
export const stopwatchPLugin = new StopwatchPlugin(stopwatch);

const { text } = TermOutput;

const listify = (array: unknown[]): string => {
  switch (array.length) {
    case 0:
      return 'nothing';
    case 1:
      return `${array[0]}`;
    case 2:
      return `${array[0]} and ${array[1]}`;
    default:
      return `${array.slice(0, array.length - 1).join(', ')}, and ${array[array.length - 1]}`;
  }
};

const displayNames = {
  nothing: 'Nothing',
  lightsout: 'Lights Out',
  tictactoe: 'Tic Tac Toe',
  unscramble: 'Unscramble',
  finaldoor: 'Mysterious Door',
};

const map = [
  ['nothing', 'lightsout', 'nothing'],
  ['tictactoe', 'nothing', 'unscramble'],
  ['nothing', 'finaldoor', 'nothing'],
];

const textMap = `
+-------------+-------------+-------------+
| Nothing     | Lights Out  | Nothing     |
| #(0,0)      | #(1,0)      | #(2,0)      |
|             | #lightsout  |             |
+-------------+-------------+-------------+
| Tic Tac Toe | Nothing     | Unscramble  |
| #(0,1)      | #(1,1)      | #(1,2)      |
| #tictactoe  |             | #unscramble |
+-------------+-------------+-------------+
| Nothing     | A cool door | Nothing     |
| #(0,2)      | #(1,2)      | #(2,2)      |
|             | #finaldoor  |             |
+-------------+-------------+-------------+
`.trim();

class Item {
  constructor(public prefix: string, public name: string, public special?: string) {}

  toString() {
    return `${this.prefix} ${this.name}`;
  }
}

const inventory: Item[] = [];
const solved = new Set<string>();
const location = { x: 1, y: 1 };
let mode: 'normal' | 'solve' = 'normal';

const puzzles = {
  lightsout: {
    lights: Array(10)
      .fill(0)
      .map(() => Math.random() > 0.5),
    actions: 0,
  },
  tictactoe: {
    boardTemplate: `
+---+---+---+
| 1 | 2 | 3 |
+---+---+---+
| 4 | 5 | 6 |
+---+---+---+
| 7 | 8 | 9 |
+---+---+---+
    `.trim(),
    startingTurn: (Math.random() > 0.5 ? 'X' : 'O') as 'X' | 'O',
    state: Array(9).fill(null) as ('X' | 'O' | null)[],
    actions: 0,
  },
  unscramble: {
    wordList: [] as string[],
    words: [] as { unscrambled: string; scrambled: string }[],
    currentGuesses: new Set<string>(),
    currentWord: 0,
    actions: 0,
  },
};

(async () => {
  puzzles.unscramble.wordList = (await (await fetch('/words.txt')).text())
    .split('\n')
    .filter(v => !!v);
})();

const makeTTTBoard = (state: ('X' | 'O' | null)[]) => {
  if (state.length !== 9) throw new Error('invalid ttt board length ' + state.length);
  let board = puzzles.tictactoe.boardTemplate;
  state.forEach((c, i) => {
    board = board.replace((i + 1).toString(), c === null ? ' ' : c);
  });
  return board.split('\n').map(text);
};
const checkTTTWinner = (state: ('X' | 'O' | null)[]) => {
  // im tired
  const all = (...indeces: number[]) => {
    const items = indeces.map(i => state[i - 1]);
    if (items.every((v, __, a) => v === a[0])) return state[indeces[0] - 1];
    return null;
  };

  const winning = [
    all(1, 2, 3),
    all(4, 5, 6),
    all(7, 8, 9),
    all(1, 4, 7),
    all(2, 5, 8),
    all(3, 6, 9),
    all(1, 5, 9),
    all(3, 5, 7),
  ].filter(v => v === 'X' || v === 'O')[0];

  return winning ? winning : !state.includes(null) ? null : false;
};
const getMapObject = () => map[location.y][location.x];
const setNormalPrompt = () =>
  setPrompt(
    `(${location.x}, ${location.y}) ${displayNames[getMapObject()]}${
      solved.has(getMapObject()) ? ' ✓' : ''
    } >&nbsp;`
  );
const setPuzzlePrompt = () =>
  setPrompt(`${displayNames[getMapObject()]}: #${puzzles[getMapObject()].actions + 1} >>&nbsp;`);
setNormalPrompt();

const addGold = (n: number) => {
  const existing = inventory.find(item => item.special === 'gold');
  if (existing) existing.prefix = (parseInt(existing.prefix) + n).toString();
  else inventory.push(new Item(n.toString(), 'gold', 'gold'));
};

export const startText = [
  text("Welcome. Solve the puzzles for free stuff. Type 'help' to get started."),
];

addGold(10);

const baseCommands: Record<string, Command> = {
  help: () => {
    if (mode === 'normal')
      return {
        output: [
          text('Normal commands:'),
          text('- inventory, i: show inventory'),
          text('- clear: clear screen'),
          text('- move, go <dir>: move around (up, down, left, right, or cardinal direction)'),
          text('- solve: solve puzzle if at a puzzle'),
          text('- map: show map'),
          text('- clear: clear screen'),
          text('Normap prompt:'),
          text('- location: (x, y)'),
          text('- current thing at your location: e.g. a door, nothing'),
          text('Puzzle prompt:'),
          text('- puzzle name: e.g. lights out'),
          text('- move #: e.g. #3'),
        ],
      };

    switch (getMapObject()) {
      case 'lightsout':
        return {
          output: [
            text('Commands:'),
            text('- flip <n>, toggle <n>: toggle the lamp at index n (not zero indexed)'),
            text('- state: show current light state'),
            text('- cancel, exit: exit puzzle'),
          ],
        };
      case 'tictactoe':
        return {
          output: [
            text('Board layout:'),
            text('  1 2 3'),
            text('  4 5 6'),
            text('  7 8 9'),
            text('Commands:'),
            text('- place <n>: place your piece at position n'),
            text('- board: show board state'),
            text('- cancel, exit: exit game'),
          ],
        };
      case 'unscramble':
        return {
          output: [
            text('Commands:'),
            text('- try <word>, guess <word>: submit an unscrambling of a word'),
            text('- skip: skip a word for 5 gold (counts as 3 guesses)'),
            text('- cancel, exit: exit puzzle'),
          ],
        };
      default:
        throw new Error('INVALID STATE: in solve state but not on a puzzle');
    }
  },
  clear: () => ({ output: text('#CLEAR#') }),
  map: () => {
    let out = textMap;
    const replacePuzzle = (mapName: string, solvedState: string, unsolvedState: string) => {
      out = out.replace(
        `#${mapName}`.padEnd(11),
        (solved.has(mapName) ? solvedState : unsolvedState).padEnd(11)
      );
    };

    replacePuzzle('lightsout', 'SOLVED', 'UNSOLVED');
    replacePuzzle('tictactoe', 'SOLVED', 'UNSOLVED');
    replacePuzzle('unscramble', 'SOLVED', 'UNSOLVED');
    replacePuzzle('finaldoor', 'UNLOCKED', 'LOCKED');

    return {
      output: [
        text('Map:'),
        ...out
          .replace(`#(${location.x},${location.y})`, 'X     ')
          .replace(/#\(\d,\d\)/g, '      ')
          .split('\n')
          .map(text),
      ],
    };
  },
  inventory: () => {
    inventory.sort((a, b) => (b.special === 'gold' ? -1 : a.special === 'gold' ? 1 : 0));
    return {
      output: [text(`You have ${listify(inventory)}.`)],
    };
  },
  move: (__, args) => {
    if (mode !== 'normal') throw new Error('solve the puzzle first!');
    if (args.length !== 1) throw new Error('expected one direction');

    switch (args[0].toLowerCase()) {
      case 'north':
      case 'up':
        if (location.y === 0) return { output: [text("You're at the top of the map!")] };
        location.y--;
        setNormalPrompt();
        return { output: [text('Moved one space up.')] };
      case 'south':
      case 'down':
        if (location.y === 2) return { output: [text("You're at the bottom of the map!")] };
        location.y++;
        setNormalPrompt();
        return { output: [text('Moved one space down.')] };
      case 'west':
      case 'left':
        if (location.x === 0) return { output: [text("You're at the left of the map!")] };
        location.x--;
        setNormalPrompt();
        return { output: [text('Moved one space left.')] };
      case 'east':
      case 'right':
        if (location.x === 2) return { output: [text("You're at the right of the map!")] };
        location.x++;
        setNormalPrompt();
        return { output: [text('Moved one space right.')] };
      default:
        throw new Error('invalid direction');
    }
  },
  solve: () => {
    if (mode !== 'normal') throw new Error('solve the puzzle first!');
    if (getMapObject() === 'nothing') throw new Error('no puzzle in current location');

    if (solved.has(getMapObject())) return { output: text("You've already solved this puzzle!") };

    mode = 'solve';

    switch (getMapObject()) {
      case 'lightsout':
        setPuzzlePrompt();
        puzzles.lightsout.actions = 0;
        puzzles.lightsout.lights = Array(10)
          .fill(0)
          .map(() => Math.random() > 0.5);
        return {
          output: [
            text(
              'Welcome to Lights Out. The goal of the puzzle is to turn all 10 lights (marked with O for on or - for off) off. Toggling the state of a light also toggles its neighbors. Points will be awarded based on # of moves taken.'
            ),
            text("See 'help' for commands."),
            text(puzzles.lightsout.lights.map(l => (l ? 'O' : '-')).join(' ')),
            text('123456789'.split('').join(' ') + ' 10'),
          ],
        };
      case 'tictactoe':
        setPuzzlePrompt();
        puzzles.tictactoe.actions = 0;
        puzzles.tictactoe.startingTurn = Math.random() > 0.5 ? 'X' : 'O';
        puzzles.tictactoe.state = Array(9).fill(null);
        if (puzzles.tictactoe.startingTurn === 'O') {
          const pos = Math.floor(Math.random() * 9) + 1;
          puzzles.tictactoe.state[pos] = 'O';
        }
        return {
          output: [
            text(
              'A simple game of tic tac toe. Win or tie to complete. 20 points for a win, 8 points for a tie. (AI is blind for now)'
            ),
            text(
              `You are playing as X${
                puzzles.tictactoe.startingTurn === 'O' ? '; O went first.' : '.'
              } Your move.`
            ),
            ...makeTTTBoard(puzzles.tictactoe.state),
            text("See 'help' for help."),
          ],
        };
      case 'unscramble':
        setPuzzlePrompt();
        puzzles.unscramble.actions = 0;
        const randomWordInRange = (min: number, max: number) => {
          const filtered = puzzles.unscramble.wordList.filter(
            v => v.length >= min && v.length <= max
          );
          return filtered[Math.floor(Math.random() * filtered.length - 1)];
        };
        const scramble = (word: string) => {
          let out = word;
          for (let i = 0; i < 10; i++)
            out = out
              .split('')
              .sort(() => 0.5 - Math.random())
              .join('');
          return out;
        };
        const words = [
          randomWordInRange(4, 5),
          randomWordInRange(6, 8),
          randomWordInRange(9, 10),
          randomWordInRange(11, 12),
          randomWordInRange(13, 15),
        ];
        puzzles.unscramble.words = words.map(w => ({ unscrambled: w, scrambled: scramble(w) }));
        return {
          output: [
            text(
              'Time to unscramble! The goal is to unscramble the 5 words given to you. Difficulty will rise throughout.'
            ),
            text('Your first word: ' + puzzles.unscramble.words[0].scrambled),
            text("See 'help' for commands."),
          ],
        };
      case 'finaldoor':
        if (
          inventory.some(i => i.name === 'red key') &&
          inventory.some(i => i.name === 'green key') &&
          inventory.some(i => i.name === 'blue key')
        ) {
          confetti.render();
          setPrompt('');
          stopwatch.stop();
          document.getElementById('clock')?.classList.add('complete');
          document.getElementsByTagName('input')[0].setAttribute('disabled', 'true');
          return {
            output: [
              text('You insert the three keys into the door, and it opens!'),
              text('*confetti*'),
              text('‏'),
              text("There isn't actually a prize, but take this confetti as my gift."),
              text('‏'),
              text(
                `You finished with ${
                  inventory.find(i => i.special == 'gold')?.prefix
                } gold. Try again (reload the page) to play again and get more!`
              ),
              text(''),
              text('Thanks for playing this puzzle game.'),
            ],
          };
        } else {
          mode = 'normal';
          return {
            output: [
              text(
                'There are three keyholes on the door, one red, one blue, and one green. I wonder where those keys could come from.'
              ),
            ],
          };
        }
      default:
        throw new Error('INVALID STATE: not on nothing but attempting to start solve');
    }
  },
  flip: (__, args) => {
    if (mode !== 'solve' || getMapObject() !== 'lightsout')
      throw new Error('Unknown command: flip');

    if (args.length !== 1) throw new Error('expected one integer');

    const index = parseInt(args[0]);

    if (!index || isNaN(index) || index < 1 || index > 10)
      throw new Error('index must be an integer between 1 and 10, inclusive.');

    const lights = puzzles.lightsout.lights;

    lights[index - 1] = !lights[index - 1];
    puzzles.lightsout.actions++;
    setPuzzlePrompt();

    if (index != 1 && lights[index - 2] != null) lights[index - 2] = !lights[index - 2];
    if (lights[index] != null) lights[index] = !lights[index];

    const winOutput: OutputRecord[] = [];

    if (!lights.some(v => v)) {
      // all off, win
      const n = puzzles.lightsout.actions;
      const gold = n < 7 ? 25 : n < 11 ? 20 : n < 15 ? 15 : n < 20 ? 10 : 5;

      inventory.push(new Item('a', 'blue key'));
      addGold(gold);
      mode = 'normal';
      solved.add('lightsout');
      setNormalPrompt();
      winOutput.push(
        text('Puzzle solved!'),
        text(`You are rewarded with ${gold} gold for solving the puzzle in ${n} actions.`),
        text(`You also receive a blue key. These items have been added to your inventory.`)
      );
    }

    return {
      output: [
        text(`Toggled light ${index}.`),
        text(lights.map(l => (l ? 'O' : '-')).join(' ')),
        text('123456789'.split('').join(' ') + ' 10'),
        ...winOutput,
      ],
    };
  },
  state: () => {
    if (mode !== 'solve' || getMapObject() !== 'lightsout')
      throw new Error('Unknown command: state');

    return {
      output: [
        text(puzzles.lightsout.lights.map(l => (l ? 'O' : '-')).join(' ')),
        text('123456789'.split('').join(' ') + ' 10'),
      ],
    };
  },
  place: (__, args) => {
    if (mode !== 'solve' || getMapObject() !== 'tictactoe')
      throw new Error('Unknown command: place');

    if (args.length !== 1) throw new Error('expected one integer');

    const index = parseInt(args[0]);

    const state = puzzles.tictactoe.state;

    if (!index || isNaN(index) || index < 1 || index > 9)
      throw new Error('index must be an integer between 1 and 9, inclusive.');

    if (state[index - 1] !== null) return { output: text("There's already a piece there!") };

    state[index - 1] = 'X';
    puzzles.tictactoe.actions++;
    setPuzzlePrompt();

    const extraText: OutputRecord[] = [];

    const endCallback = (winner: 'X' | 'O' | null) => {
      extraText.push(text(winner === 'X' ? 'You win!' : winner === 'O' ? 'You lose!' : 'Tie!'));

      if (winner === 'X' || winner == null) {
        const gold = winner ? 20 : 8;

        inventory.push(new Item('a', 'red key'));
        addGold(gold);
        solved.add('tictactoe');

        extraText.push(
          text(`You are rewarded with ${gold} gold for completing the game.`),
          text(`You also receive a red key. These items have been added to your inventory.`)
        );
      } else {
        extraText.push(text('You can try again to get the reward.'));
      }

      mode = 'normal';
      setNormalPrompt();
    };

    let aiPosition: number | null = null;

    let win = checkTTTWinner(state);
    if (win === 'X' || win === null) endCallback(win);
    else {
      // AI turn
      if (state.includes(null)) {
        while (aiPosition == null || puzzles.tictactoe.state[aiPosition] !== null)
          aiPosition = Math.floor(Math.random() * 8);
        state[aiPosition] = 'O';
      }

      win = checkTTTWinner(state);
      if (win === 'O' || win === null) endCallback(win);
    }

    return {
      output: [
        ...(aiPosition !== null ? [text(`AI placed in location ${aiPosition + 1}.`)] : []),
        ...makeTTTBoard(state),
        ...extraText,
      ],
    };
  },
  board: () => {
    if (mode !== 'solve' || getMapObject() !== 'tictactoe')
      throw new Error('Unknown command: board');

    return {
      output: makeTTTBoard(puzzles.tictactoe.state),
    };
  },
  try: (__, args) => {
    if (mode !== 'solve' || getMapObject() !== 'unscramble')
      throw new Error('Unknown command: try');

    if (args.length !== 1) throw new Error('expected one word');

    console.log(`trying to solve #${puzzles.unscramble.currentWord}`);

    const word = puzzles.unscramble.words[puzzles.unscramble.currentWord];

    if (puzzles.unscramble.currentGuesses.has(args[0]))
      return { output: text("You've already guessed that!") };

    puzzles.unscramble.actions++;
    setPuzzlePrompt();

    const extraText: OutputRecord[] = [];
    if (word.unscrambled.toLowerCase() === args[0].toLowerCase()) {
      puzzles.unscramble.currentWord++;

      console.log(`done, moving to #${puzzles.unscramble.currentWord}`);

      extraText.push(text('Correct! The word was ' + word.unscrambled));

      if (puzzles.unscramble.currentWord === 5) {
        const n = puzzles.unscramble.actions;
        const gold = n < 6 ? 30 : n < 10 ? 20 : n < 15 ? 15 : n < 20 ? 10 : 5;
        inventory.push(new Item('a', 'green key'));
        addGold(gold);
        mode = 'normal';
        solved.add('unscramble');
        setNormalPrompt();
        extraText.push(
          text('Puzzle solved!'),
          text(`You are rewarded with ${gold} gold for solving the puzzle in ${n} actions.`),
          text(`You also receive a green key. These items have been added to your inventory.`)
        );
      } else {
        extraText.push(
          text('Next word: ' + puzzles.unscramble.words[puzzles.unscramble.currentWord].scrambled)
        );
      }
    }
    return {
      output: extraText.length
        ? extraText
        : [text('Incorrect, try again!'), text('The word is: ' + word.scrambled)],
    };
  },
  skip: () => {
    if (mode !== 'solve' || getMapObject() !== 'unscramble')
      throw new Error('Unknown command: skip');

    const gold = parseInt(inventory.find(i => i.special == 'gold')?.prefix ?? '0');

    if (gold < 5) return { output: text("You don't have enough gold!") };

    addGold(-5);
    puzzles.unscramble.currentWord++;

    puzzles.lightsout.actions += 3;
    setPuzzlePrompt();

    const extraText: OutputRecord[] = [];

    if (puzzles.unscramble.currentWord === 5) {
      const n = puzzles.unscramble.actions;
      const gold = n < 6 ? 30 : n < 10 ? 20 : n < 15 ? 15 : n < 20 ? 10 : 5;
      inventory.push(new Item('a', 'green key'));
      addGold(gold);
      mode = 'normal';
      solved.add('unscramble');
      setNormalPrompt();
      extraText.push(
        text('Puzzle solved!'),
        text(`You are rewarded with ${gold} gold for solving the puzzle in ${n} actions.`),
        text(`You also receive a green key. These items have been added to your inventory.`)
      );
    } else {
      extraText.push(
        text('Next word: ' + puzzles.unscramble.words[puzzles.unscramble.currentWord].scrambled)
      );
    }

    return {
      output: [
        text(
          'Skipped word for 5 gold: the correct answer was ' +
            puzzles.unscramble.words[puzzles.unscramble.currentWord - 1].unscrambled
        ),
        ...extraText,
      ],
    };
  },
  cancel: () => {
    if (mode === 'normal') throw new Error('nothing to cancel');

    mode = 'normal';
    setNormalPrompt();

    return { output: text(`Exited ${displayNames[getMapObject()]}.`) };
  },
};

export const commands = createCommands({
  ...baseCommands,
  // aliases
  i: baseCommands.inventory,
  go: baseCommands.move,
  exit: baseCommands.cancel,
  guess: baseCommands.try,
  toggle: baseCommands.flip,
});

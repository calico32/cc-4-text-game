import { setPrompt } from './prompt';
import { TermOutput } from './terminal';
import { create as createCommands } from './terminal/emulator-state/command-mapping';
import { Command, OutputRecord } from './terminal/types';

const { error, text } = TermOutput;

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
};

const makeTTTBoard = (state: ('X' | 'O' | null)[]) => {
  if (state.length !== 9) throw new Error('invalid ttt board length ' + state.length);
  let board = puzzles.tictactoe.boardTemplate;
  console.log(state);
  state.forEach((c, i) => {
    board = board.replace((i + 1).toString(), c === null ? ' ' : c);
  });
  return board.split('\n').map(text);
};
const checkTTTWinner = (state: ('X' | 'O' | null)[]) => {
  // im tired
  const all = (...indeces: number[]) => {
    if (indeces.map(i => state[i]).every((v, __, a) => v === a[0])) return state[indeces[0]];
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
  ].filter(v => !!v)[0];

  return winning ? winning : state.every(v => !!v) ? null : false;
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
  if (existing) existing.prefix === (parseInt(existing.prefix) + n).toString();
  else inventory.push(new Item(n.toString(), 'gold', 'gold'));
};

export const startText = [
  text("Welcome. Solve the puzzles for free stuff. Type 'help' to get started."),
];

const baseCommands: Record<string, Command> = {
  help: () => {
    if (mode === 'normal')
      return {
        output: [
          text('Text game'),
          text('Commands:'),
          text('- inventory, i: show inventory'),
          text('- clear: clear screen'),
          text('- move, go <dir>: move around (up, down, left, right, or cardinal direction)'),
          text('- solve: solve puzzle if at a puzzle'),
          text('- map: show map'),
          text('Prompt:'),
          text('- location: (x, y)'),
          text('- current thing at your location: e.g. a door, nothing'),
        ],
      };

    switch (getMapObject()) {
      case 'lightsout':
        return {
          output: [
            text('Commands:'),
            text('- flip <n>: toggle the lamp at index n (not zero indexed)'),
            text('- state: show current light state'),
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
          ],
        };
      case 'unscramble':
        return {
          output: [
            text('Commands:'),
            text('- try <word>: submit an unscrambling of a word'),
            text('- skip: skip a word for 3 gold'),
          ],
        };
      default:
        throw new Error('INVALID STATE: in solve state but not on a puzzle');
    }
  },
  clear: () => ({ output: text('#CLEAR#') }),
  map: () => {
    if (mode !== 'normal') throw new Error('solve the puzzle first!');
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
    if (mode !== 'normal') throw new Error('solve the puzzle first!');
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
    if (getMapObject() === 'nothing' || getMapObject() === 'finaldoor')
      throw new Error('no puzzle in current location');

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
        return {
          output: [
            text(
              'Time to unscramble! The goal is to unscramble the 5 words given to you. Difficulty will rise throughout.'
            ),
            text("See 'help' for commands."),
          ],
        };
      default:
        throw new Error('INVALID STATE: not on normal or finaldoor but attempting to start solve');
    }
  },
  flip: (__, args) => {
    if (mode !== 'solve' && getMapObject() !== 'lightsout')
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
    if (mode !== 'solve' && getMapObject() !== 'lightsout')
      throw new Error('Unknown command: state');

    return {
      output: [
        text(puzzles.lightsout.lights.map(l => (l ? 'O' : '-')).join(' ')),
        text('123456789'.split('').join(' ') + ' 10'),
      ],
    };
  },
  place: (__, args) => {
    if (mode !== 'solve' && getMapObject() !== 'tictactoe')
      throw new Error('Unknown command: place');

    if (args.length !== 1) throw new Error('expected one integer');

    const index = parseInt(args[0]);

    const state = puzzles.tictactoe.state;

    if (!index || isNaN(index) || index < 1 || index > 9)
      throw new Error('index must be an integer between 1 and 9, inclusive.');

    if (state[index - 1] !== null) return { output: text("There's already a piece there!") };

    state[index - 1] = 'X';

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

    let win = checkTTTWinner(state);
    if (win === 'X' || win === null) endCallback(win);

    // AI turn
    let aiPosition: number | null = null;
    if (!state.every(v => !!v)) {
      while (aiPosition == null || puzzles.tictactoe.state[aiPosition] !== null)
        aiPosition = Math.floor(Math.random() * 8);
      state[aiPosition] = 'O';
    }

    win = checkTTTWinner(state);
    if (win === 'O' || win === null) endCallback(win);

    return {
      output: [
        ...(aiPosition ? [text(`AI placed in location ${aiPosition + 1}.`)] : []),
        ...makeTTTBoard(state),
      ],
    };
  },
  board: () => {
    if (mode !== 'solve' && getMapObject() !== 'tictactoe')
      throw new Error('Unknown command: board');

    return {
      output: makeTTTBoard(puzzles.tictactoe.state),
    };
  },
  try: (__, args) => {
    if (mode !== 'solve' && getMapObject() !== 'unscramble')
      throw new Error('Unknown command: try');

    if (args.length !== 1) throw new Error('expected one word');
  },
};

export const commands = createCommands({
  ...baseCommands,
  // aliases
  i: baseCommands.inventory,
  go: baseCommands.move,
});

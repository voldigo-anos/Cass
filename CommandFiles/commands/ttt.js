// CommandFiles/commands/ttt.js
// @ts-check

/**
 * @type {CommandMeta}
 */
export const meta = {
  name: "ttt",
  description: "Tic-Tac-Toe game (IA imbattable)",
  author: "@lianecagara",
  version: "1.1.0",
  usage: "{prefix}{name}",
  category: "Chance Games",
  permissions: [0],
  noPrefix: false,
  waitingTime: 60,
  requirement: "3.0.0",
  icon: "⭕",
  cmdType: "arl_g",
  isGame: true,
};

const rewardOrig = 50;
const X = "❌";
const O = "⭕";
const EMPTY = "⬜";

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const { delay } = global.utils;

function checkWin(board, player) {
  return WINNING_COMBINATIONS.some(c =>
    c.every(i => board[i] === player)
  );
}

class TicTacToe {
  constructor() {
    this.board = Array(9).fill(EMPTY);
    this.currentPlayer = X;
  }

  displayBoard() {
    let str = "";
    for (let i = 0; i < 9; i += 3) {
      str += this.board.slice(i, i + 3).join("") + "\n";
    }
    return str;
  }

  makeMove(slot) {
    if (slot < 0 || slot > 8 || this.board[slot] !== EMPTY) return false;
    this.board[slot] = this.currentPlayer;
    return true;
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === X ? O : X;
  }

  isGameOver() {
    return (
      checkWin(this.board, X) ||
      checkWin(this.board, O) ||
      !this.board.includes(EMPTY)
    );
  }

  // IA imbattable avec Minimax
  makeAIMoveV2() {
    const bestMove = this.findBestMove();
    this.board[bestMove] = this.currentPlayer;
  }

  findBestMove() {
    let bestVal = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === EMPTY) {
        this.board[i] = this.currentPlayer;
        let moveVal = this.minimax(0, false);
        this.board[i] = EMPTY;
        if (moveVal > bestVal) {
          bestVal = moveVal;
          move = i;
        }
      }
    }
    return move;
  }

  minimax(depth, isMax) {
    if (checkWin(this.board, O)) return 10 - depth;
    if (checkWin(this.board, X)) return depth - 10;
    if (!this.board.includes(EMPTY)) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === EMPTY) {
          this.board[i] = O;
          best = Math.max(best, this.minimax(depth + 1, false));
          this.board[i] = EMPTY;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === EMPTY) {
          this.board[i] = X;
          best = Math.min(best, this.minimax(depth + 1, true));
          this.board[i] = EMPTY;
        }
      }
      return best;
    }
  }

  playRound(slot, onWin = () => {}) {
    if (!this.makeMove(slot)) return "❌ Coup invalide";

    if (checkWin(this.board, this.currentPlayer)) {
      onWin(this.currentPlayer);
      return "WIN";
    }

    if (!this.board.includes(EMPTY)) return "DRAW";

    this.switchPlayer();
    this.makeAIMoveV2();

    if (checkWin(this.board, this.currentPlayer)) return "LOSE";
    if (!this.board.includes(EMPTY)) return "DRAW";

    this.switchPlayer();
    return "CONTINUE";
  }
}

/**
 * @param {CommandContext}
 */
export async function entry({ input, output, commandName }) {
  const game = new TicTacToe();
  const msg = await output.reply(game.displayBoard());
  input.setReply(msg.messageID, {
    key: commandName,
    id: input.senderID,
    game,
  });
}

export let game2 = new TicTacToe();

/**
 * @param {CommandContext & { repObj: { game: typeof game2; id: string; key: string }; detectID: string }}
 */
export async function reply({
  input,
  output,
  repObj,
  detectID,
  money,
  getInflationRate,
}) {
  await delay(500);

  if (input.senderID !== repObj.id) return;

  const rate = await getInflationRate();
  const reward = Math.round(rewardOrig + rewardOrig * rate);

  const slot = parseInt(input.body) - 1;
  const result = repObj.game.playRound(slot, async (p) => {
    if (p === X) {
      const { money: m } = await money.getCache(input.senderID);
      await money.set(input.senderID, { money: m + reward });
    }
  });

  let msg = repObj.game.displayBoard();

  if (result === "WIN") {
    msg += `\n🎉 Tu as gagné ${reward}$`;
    input.delReply(detectID);
  } else if (result === "LOSE") {
    msg += "\n💀 L'IA a gagné";
    input.delReply(detectID);
  } else if (result === "DRAW") {
    msg += "\n🤝 Match nul";
    input.delReply(detectID);
  }

  const sent = await output.reply(msg);

  if (result === "CONTINUE" || result === "❌ Coup invalide") {
    input.setReply(sent.messageID, repObj);
  }
  }

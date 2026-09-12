const ROWS = 8;
const COLS = 8;
const MINES = 10;

const NUMBER_COLORS = [
  '',
  'blue',
  'green',
  'red',
  'darkblue',
  'brown',
  'teal',
  'black',
  'gray',
];

let board = [];
let status = 'playing'; // 'playing' | 'won' | 'lost'

const boardEl = document.getElementById('board');
const minesCountEl = document.getElementById('mines-count');
const resetBtn = document.getElementById('reset-btn');
const statusMsgEl = document.getElementById('status-msg');

function createBoard() {
  const newBoard = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      });
    }
    newBoard.push(row);
  }

  // Place mines randomly
  let placedMines = 0;
  while (placedMines < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!newBoard[r][c].isMine) {
      newBoard[r][c].isMine = true;
      placedMines++;
    }
  }

  // Calculate neighbor mines
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      newBoard[r][c].neighborMines = count;
    }
  }

  return newBoard;
}

function initGame() {
  board = createBoard();
  status = 'playing';
  render();
}

function revealCell(r, c) {
  if (status !== 'playing') return;
  const cell = board[r][c];
  if (cell.isRevealed || cell.isFlagged) return;

  if (cell.isMine) {
    // Reveal all mines on game over
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (board[row][col].isMine) {
          board[row][col].isRevealed = true;
        }
      }
    }
    status = 'lost';
    render();
    return;
  }

  // Flood fill to reveal adjacent cells
  const stack = [[r, c]];
  while (stack.length > 0) {
    const [currR, currC] = stack.pop();
    const curr = board[currR][currC];
    if (curr.isRevealed || curr.isFlagged) continue;
    curr.isRevealed = true;

    if (curr.neighborMines === 0 && !curr.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = currR + dr;
          const nc = currC + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            if (!board[nr][nc].isRevealed && !board[nr][nc].isFlagged) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }
  }

  // Check win condition: all non-mine cells are revealed
  let unrevealedSafeCells = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!board[row][col].isMine && !board[row][col].isRevealed) {
        unrevealedSafeCells++;
      }
    }
  }

  if (unrevealedSafeCells === 0) {
    status = 'won';
  }

  render();
}

function toggleFlag(r, c) {
  if (status !== 'playing') return;
  const cell = board[r][c];
  if (cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
  render();
}

function render() {
  const flagsCount = board.reduce(
    (acc, row) => acc + row.filter((c) => c.isFlagged).length,
    0
  );

  minesCountEl.textContent = `💣 Мин: ${MINES - flagsCount}`;

  if (status === 'lost') {
    resetBtn.textContent = '😵 Заново';
    statusMsgEl.innerHTML = '<span class="status-lost">💥 Вы проиграли!</span>';
  } else if (status === 'won') {
    resetBtn.textContent = '😎 Заново';
    statusMsgEl.innerHTML = '<span class="status-won">🎉 Вы победили!</span>';
  } else {
    resetBtn.textContent = '🙂 Заново';
    statusMsgEl.innerHTML = '<span>Правый клик — флаг, левый — открыть</span>';
  }

  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      const btn = document.createElement('button');
      btn.className = 'cell' + (cell.isRevealed ? ' revealed' : '');

      let content = '';
      let textColor = '#000';

      if (cell.isRevealed) {
        if (cell.isMine) {
          content = '💣';
        } else if (cell.neighborMines > 0) {
          content = cell.neighborMines.toString();
          textColor = NUMBER_COLORS[cell.neighborMines] || '#000';
        }
      } else if (cell.isFlagged) {
        content = '🚩';
      }

      btn.textContent = content;
      btn.style.color = textColor;

      btn.addEventListener('click', () => revealCell(r, c));
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      });

      boardEl.appendChild(btn);
    }
  }
}

resetBtn.addEventListener('click', initGame);

initGame();

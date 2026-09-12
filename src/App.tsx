import { useState } from 'react'

const ROWS = 8
const COLS = 8
const MINES = 10

type Cell = {
  row: number
  col: number
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
}

function createBoard(): Cell[][] {
  const board: Cell[][] = []
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = []
    for (let c = 0; c < COLS; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      })
    }
    board.push(row)
  }

  // Place mines randomly
  let placedMines = 0
  while (placedMines < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (!board[r][c].isMine) {
      board[r][c].isMine = true
      placedMines++
    }
  }

  // Calculate neighbor mines
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
            count++
          }
        }
      }
      board[r][c].neighborMines = count
    }
  }

  return board
}

export default function App() {
  const [board, setBoard] = useState<Cell[][]>(() => createBoard())
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')

  const resetGame = () => {
    setBoard(createBoard())
    setStatus('playing')
  }

  const revealCell = (r: number, c: number) => {
    if (status !== 'playing') return
    const cell = board[r][c]
    if (cell.isRevealed || cell.isFlagged) return

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })))

    if (newBoard[r][c].isMine) {
      // Reveal all mines on game over
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (newBoard[row][col].isMine) {
            newBoard[row][col].isRevealed = true
          }
        }
      }
      setBoard(newBoard)
      setStatus('lost')
      return
    }

    // Flood fill to reveal adjacent cells
    const stack: [number, number][] = [[r, c]]
    while (stack.length > 0) {
      const [currR, currC] = stack.pop()!
      const curr = newBoard[currR][currC]
      if (curr.isRevealed || curr.isFlagged) continue
      curr.isRevealed = true

      if (curr.neighborMines === 0 && !curr.isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr
            const nc = currC + dc
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
                stack.push([nr, nc])
              }
            }
          }
        }
      }
    }

    // Check win condition: all non-mine cells are revealed
    let unrevealedSafeCells = 0
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!newBoard[row][col].isMine && !newBoard[row][col].isRevealed) {
          unrevealedSafeCells++
        }
      }
    }

    if (unrevealedSafeCells === 0) {
      setStatus('won')
    }

    setBoard(newBoard)
  }

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault()
    if (status !== 'playing') return
    const cell = board[r][c]
    if (cell.isRevealed) return

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })))
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged
    setBoard(newBoard)
  }

  const flagsCount = board.reduce(
    (acc, row) => acc + row.filter((c) => c.isFlagged).length,
    0
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        userSelect: 'none',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <h1>Сапёр</h1>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>💣 Мин: {MINES - flagsCount}</div>
        <button
          onClick={resetGame}
          style={{
            fontSize: '18px',
            padding: '6px 14px',
            cursor: 'pointer',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        >
          {status === 'lost' ? '😵 Заново' : status === 'won' ? '😎 Заново' : '🙂 Заново'}
        </button>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>
        {status === 'lost' && <span style={{ color: 'red' }}>💥 Вы проиграли!</span>}
        {status === 'won' && <span style={{ color: 'green' }}>🎉 Вы победили!</span>}
        {status === 'playing' && <span>Правый клик — флаг, левый — открыть</span>}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 36px)`,
          gridTemplateRows: `repeat(${ROWS}, 36px)`,
          gap: '2px',
          backgroundColor: '#888',
          padding: '4px',
          borderRadius: '6px',
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            let content = ''
            let cellBg = '#bbb'
            let textColor = '#000'

            if (cell.isRevealed) {
              cellBg = '#ddd'
              if (cell.isMine) {
                content = '💣'
              } else if (cell.neighborMines > 0) {
                content = cell.neighborMines.toString()
                const colors = [
                  '',
                  'blue',
                  'green',
                  'red',
                  'darkblue',
                  'brown',
                  'teal',
                  'black',
                  'gray',
                ]
                textColor = colors[cell.neighborMines] || '#000'
              }
            } else if (cell.isFlagged) {
              content = '🚩'
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: cellBg,
                  color: textColor,
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: cell.isRevealed ? '1px solid #aaa' : '2px outset #fff',
                  cursor: cell.isRevealed ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  outline: 'none',
                }}
              >
                {content}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

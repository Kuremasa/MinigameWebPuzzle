'use strict';

const Piece = (() => {
  /** Shape templates as absolute spawn positions inside the center 3x3 (6..8). */
  const SHAPES = [
    // Vertical 1x3
    [
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
    ],
    // Horizontal 3x1
    [
      { x: 6, y: 7 },
      { x: 7, y: 7 },
      { x: 8, y: 7 },
    ],
    // L variants: 2x2 square missing one cell (anchor at top-left of 2x2 = 6,6 / 7,6 / 6,7 / 7,7)
    // Missing bottom-right of 2x2 at (6,6)
    [
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 6, y: 7 },
    ],
    // Missing bottom-left of 2x2 at (7,6)
    [
      { x: 7, y: 6 },
      { x: 8, y: 6 },
      { x: 8, y: 7 },
    ],
    // Missing top-right of 2x2 at (6,7)
    [
      { x: 6, y: 7 },
      { x: 6, y: 8 },
      { x: 7, y: 8 },
    ],
    // Missing top-left of 2x2 at (7,7)
    [
      { x: 8, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
    ],
  ];

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function randomColor() {
    return 1 + randomInt(COLOR_COUNT);
  }

  /**
   * Create a new active piece definition (positions + colors) without writing to grid.
   * @returns {{ cells: {x:number,y:number,color:number}[] }}
   */
  function createSpawnPiece() {
    const shape = SHAPES[randomInt(SHAPES.length)];
    const cells = shape.map(({ x, y }) => ({
      x,
      y,
      color: randomColor(),
    }));
    return { cells };
  }

  /**
   * Try to place piece onto grid. Returns false if any target cell is occupied.
   */
  function canPlace(grid, cells) {
    for (const { x, y } of cells) {
      if (y < 0 || y >= GRID_SIZE || x < 0 || x >= GRID_SIZE) return false;
      if (grid[y][x] !== 0) return false;
    }
    return true;
  }

  function writeToGrid(grid, cells) {
    for (const { x, y, color } of cells) {
      grid[y][x] = color;
    }
  }

  function eraseFromGrid(grid, cells) {
    for (const { x, y } of cells) {
      grid[y][x] = 0;
    }
  }

  /**
   * Check whether active cells can move by (dx, dy) without colliding with
   * non-active occupied cells or leaving the board.
   */
  function canMove(grid, cells, dx, dy) {
    const activeSet = new Set(cells.map((c) => `${c.x},${c.y}`));
    for (const cell of cells) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
        return false;
      }
      if (grid[ny][nx] !== 0 && !activeSet.has(`${nx},${ny}`)) {
        return false;
      }
    }
    return true;
  }

  function moveCells(grid, cells, dx, dy) {
    eraseFromGrid(grid, cells);
    for (const cell of cells) {
      cell.x += dx;
      cell.y += dy;
    }
    writeToGrid(grid, cells);
  }

  /**
   * Soft-drop one step. Returns false if locked (could not move).
   */
  function tryFall(grid, cells) {
    if (!canMove(grid, cells, 0, 1)) return false;
    moveCells(grid, cells, 0, 1);
    return true;
  }

  /**
   * Hard-drop to lowest position, then return (caller should lock).
   */
  function hardDrop(grid, cells) {
    while (canMove(grid, cells, 0, 1)) {
      moveCells(grid, cells, 0, 1);
    }
  }

  return {
    createSpawnPiece,
    canPlace,
    writeToGrid,
    eraseFromGrid,
    canMove,
    moveCells,
    tryFall,
    hardDrop,
  };
})();

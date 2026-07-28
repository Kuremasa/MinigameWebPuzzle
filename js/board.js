'use strict';

const Board = (() => {
  function createEmptyGrid(size = GRID_SIZE) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function cloneGrid(grid) {
    return grid.map((row) => row.slice());
  }

  /**
   * Clockwise 90°: new[x][N-1-y] = old[y][x]
   */
  function rotateClockwise(grid) {
    const n = grid.length;
    const next = createEmptyGrid(n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        next[x][n - 1 - y] = grid[y][x];
      }
    }
    return next;
  }

  /**
   * Counter-clockwise 90°: new[N-1-x][y] = old[y][x]
   */
  function rotateCounterClockwise(grid) {
    const n = grid.length;
    const next = createEmptyGrid(n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        next[n - 1 - x][y] = grid[y][x];
      }
    }
    return next;
  }

  function transformCellCW(x, y, n = GRID_SIZE) {
    return { x: n - 1 - y, y: x };
  }

  function transformCellCCW(x, y, n = GRID_SIZE) {
    return { x: y, y: n - 1 - x };
  }

  /**
   * Drop every floating block one cell downward if the cell below is empty.
   * Returns true if any block moved.
   */
  function stepGravity(grid) {
    const n = grid.length;
    let moved = false;
    for (let x = 0; x < n; x++) {
      for (let y = n - 2; y >= 0; y--) {
        if (grid[y][x] !== 0 && grid[y + 1][x] === 0) {
          grid[y + 1][x] = grid[y][x];
          grid[y][x] = 0;
          moved = true;
        }
      }
    }
    return moved;
  }

  /**
   * Apply gravity until stable. Mutates grid. Returns number of steps taken.
   */
  function applyFullGravity(grid) {
    let steps = 0;
    while (stepGravity(grid)) {
      steps += 1;
    }
    return steps;
  }

  /**
   * Flood-fill groups of same-colored cells (4-connected).
   * Returns array of groups with length >= minSize.
   * Each group is an array of {x, y}.
   */
  function findConnectedGroups(grid, minSize = 4) {
    const n = grid.length;
    const visited = Array.from({ length: n }, () => Array(n).fill(false));
    const groups = [];
    const dirs = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const color = grid[y][x];
        if (color === 0 || visited[y][x]) continue;

        const stack = [{ x, y }];
        const group = [];
        visited[y][x] = true;

        while (stack.length > 0) {
          const cell = stack.pop();
          group.push(cell);
          for (const [dx, dy] of dirs) {
            const nx = cell.x + dx;
            const ny = cell.y + dy;
            if (
              nx >= 0 &&
              nx < n &&
              ny >= 0 &&
              ny < n &&
              !visited[ny][nx] &&
              grid[ny][nx] === color
            ) {
              visited[ny][nx] = true;
              stack.push({ x: nx, y: ny });
            }
          }
        }

        if (group.length >= minSize) {
          groups.push(group);
        }
      }
    }

    return groups;
  }

  function clearCells(grid, cells) {
    for (const { x, y } of cells) {
      grid[y][x] = 0;
    }
  }

  function chainMultiplier(chainCount) {
    if (chainCount <= 0) return 1;
    return Math.pow(2, chainCount - 1);
  }

  return {
    createEmptyGrid,
    cloneGrid,
    rotateClockwise,
    rotateCounterClockwise,
    transformCellCW,
    transformCellCCW,
    stepGravity,
    applyFullGravity,
    findConnectedGroups,
    clearCells,
    chainMultiplier,
  };
})();

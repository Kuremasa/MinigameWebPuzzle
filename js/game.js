'use strict';

const Game = (() => {
  let grid = null;
  /** @type {{x:number,y:number,color:number}[]|null} */
  let activeCells = null;
  let state = GameState.SPAWNING;
  let score = 0;
  let chainCount = 0;
  let fallAcc = 0;
  let gravityAcc = 0;
  let clearAcc = 0;
  /** @type {Set<string>|null} */
  let flashSet = null;
  let flashPhase = 0;
  /** @type {{x:number,y:number}[]|null} */
  let pendingClearCells = null;
  let lastTs = 0;
  let rafId = 0;

  const scoreEl = () => document.getElementById('score');
  const chainEl = () => document.getElementById('chain');
  const overlayEl = () => document.getElementById('overlay');
  const overlayScoreEl = () => document.getElementById('overlay-score');

  function updateHud() {
    const s = scoreEl();
    const c = chainEl();
    if (s) s.textContent = String(score);
    if (c) c.textContent = String(chainCount);
  }

  function setState(next) {
    state = next;
    Input.setControlsEnabled(state === GameState.PLAYING);
    const overlay = overlayEl();
    if (overlay) {
      if (state === GameState.GAME_OVER) {
        overlay.classList.remove('hidden');
        const os = overlayScoreEl();
        if (os) os.textContent = `SCORE: ${score}`;
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  function start() {
    grid = Board.createEmptyGrid();
    activeCells = null;
    score = 0;
    chainCount = 0;
    fallAcc = 0;
    gravityAcc = 0;
    clearAcc = 0;
    flashSet = null;
    flashPhase = 0;
    pendingClearCells = null;
    lastTs = 0;
    updateHud();
    setState(GameState.SPAWNING);
    spawnPiece();
    if (!rafId) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function spawnPiece() {
    setState(GameState.SPAWNING);
    const piece = Piece.createSpawnPiece();
    if (!Piece.canPlace(grid, piece.cells)) {
      activeCells = null;
      setState(GameState.GAME_OVER);
      return;
    }
    Piece.writeToGrid(grid, piece.cells);
    activeCells = piece.cells;
    score += SPAWN_SCORE;
    chainCount = 0;
    fallAcc = 0;
    updateHud();
    setState(GameState.PLAYING);
  }

  function lockActivePiece() {
    activeCells = null;
    chainCount = 0;
    beginFalling();
  }

  function beginFalling() {
    gravityAcc = 0;
    setState(GameState.FALLING);
  }

  function finishClear() {
    if (pendingClearCells) {
      Board.clearCells(grid, pendingClearCells);
    }
    pendingClearCells = null;
    flashSet = null;
    beginFalling();
  }

  function rotateField(clockwise) {
    if (state !== GameState.PLAYING || !activeCells) return;

    const rotateGrid = clockwise
      ? Board.rotateClockwise
      : Board.rotateCounterClockwise;
    const transformCell = clockwise
      ? Board.transformCellCW
      : Board.transformCellCCW;

    grid = rotateGrid(grid);
    activeCells = activeCells.map((cell) => {
      const t = transformCell(cell.x, cell.y);
      return { x: t.x, y: t.y, color: cell.color };
    });

    fallAcc = 0;
    beginFalling();
  }

  /**
   * Whole-field gravity one step; keeps activeCells coords in sync.
   */
  function stepGravityWithActive() {
    const n = GRID_SIZE;
    const activeByKey = new Map();
    if (activeCells) {
      for (const c of activeCells) {
        activeByKey.set(`${c.x},${c.y}`, c);
      }
    }

    let moved = false;
    for (let x = 0; x < n; x++) {
      for (let y = n - 2; y >= 0; y--) {
        if (grid[y][x] !== 0 && grid[y + 1][x] === 0) {
          grid[y + 1][x] = grid[y][x];
          grid[y][x] = 0;
          moved = true;

          const key = `${x},${y}`;
          if (activeByKey.has(key)) {
            const cell = activeByKey.get(key);
            activeByKey.delete(key);
            cell.y = y + 1;
            activeByKey.set(`${x},${y + 1}`, cell);
          }
        }
      }
    }

    return moved;
  }

  function afterFallingSettled() {
    beginClearingFromFall();
  }

  function beginClearingFromFall() {
    const groups = Board.findConnectedGroups(grid, 4);
    if (groups.length === 0) {
      pendingClearCells = null;
      flashSet = null;
      // Resume playing if active piece still on board; otherwise spawn.
      if (activeCells && activeCells.length > 0) {
        // Verify active cells still match grid (not somehow lost)
        const stillValid = activeCells.every(
          (c) => grid[c.y][c.x] === c.color
        );
        if (stillValid) {
          fallAcc = 0;
          setState(GameState.PLAYING);
          return;
        }
      }
      activeCells = null;
      spawnPiece();
      return;
    }

    const cells = [];
    for (const g of groups) {
      for (const cell of g) cells.push(cell);
    }

    // If any active cell is cleared, drop active control
    if (activeCells) {
      const clearKeys = new Set(cells.map((c) => `${c.x},${c.y}`));
      const hit = activeCells.some((c) => clearKeys.has(`${c.x},${c.y}`));
      if (hit) {
        activeCells = null;
      }
    }

    pendingClearCells = cells;
    flashSet = new Set(cells.map((c) => `${c.x},${c.y}`));
    flashPhase = 0;
    clearAcc = 0;

    chainCount += 1;
    const mult = Board.chainMultiplier(chainCount);
    score += cells.length * CLEAR_BASE * mult;
    updateHud();
    setState(GameState.CLEARING);
  }

  function onHardDrop() {
    if (state !== GameState.PLAYING || !activeCells) return;
    Piece.hardDrop(grid, activeCells);
    lockActivePiece();
  }

  function onSoftFall() {
    if (!activeCells) {
      lockActivePiece();
      return;
    }
    const moved = Piece.tryFall(grid, activeCells);
    if (!moved) {
      lockActivePiece();
    }
  }

  function update(dt) {
    if (state === GameState.PLAYING) {
      fallAcc += dt;
      while (fallAcc >= FALL_INTERVAL_MS) {
        fallAcc -= FALL_INTERVAL_MS;
        if (state !== GameState.PLAYING) break;
        onSoftFall();
      }
      return;
    }

    if (state === GameState.FALLING) {
      gravityAcc += dt;
      while (gravityAcc >= GRAVITY_STEP_MS) {
        gravityAcc -= GRAVITY_STEP_MS;
        const moved = stepGravityWithActive();
        if (!moved) {
          afterFallingSettled();
          break;
        }
      }
      return;
    }

    if (state === GameState.CLEARING) {
      clearAcc += dt;
      flashPhase = clearAcc / CLEAR_FLASH_MS;
      if (clearAcc >= CLEAR_FLASH_MS) {
        finishClear();
      }
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(64, ts - lastTs);
    lastTs = ts;

    update(dt);
    Renderer.draw(grid, { flashSet, flashPhase });
    rafId = requestAnimationFrame(loop);
  }

  function bindInput() {
    Input.init({
      onRotateLeft: () => rotateField(false),
      onRotateRight: () => rotateField(true),
      onHardDrop: onHardDrop,
      onRestart: start,
    });
  }

  return {
    start,
    bindInput,
    getState: () => state,
    getGrid: () => grid,
  };
})();

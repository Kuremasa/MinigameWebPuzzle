'use strict';

const Renderer = (() => {
  let canvas = null;
  let ctx = null;
  let logicalSize = GRID_SIZE * CELL_SIZE;
  /** @type {(HTMLImageElement|null)[]} index 0 unused; 1..4 sprites */
  let blockImages = [null, null, null, null, null];
  let imagesReady = false;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  /**
   * Load block sprites. Resolves when all are ready (or failed).
   * @returns {Promise<void>}
   */
  function loadImages() {
    const tasks = [];
    for (let i = 1; i <= COLOR_COUNT; i++) {
      tasks.push(
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            blockImages[i] = img;
            resolve();
          };
          img.onerror = () => {
            console.warn('Failed to load block image:', BLOCK_IMAGE_SRCS[i]);
            blockImages[i] = null;
            resolve();
          };
          img.src = BLOCK_IMAGE_SRCS[i];
        })
      );
    }
    return Promise.all(tasks).then(() => {
      imagesReady = blockImages.slice(1).some((img) => img != null);
    });
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    logicalSize = GRID_SIZE * CELL_SIZE;
    canvas.width = Math.floor(logicalSize * dpr);
    canvas.height = Math.floor(logicalSize * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCellFallback(x, y, colorIndex, alpha) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const pad = 1.5;
    const size = CELL_SIZE - pad * 2;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS[colorIndex] || '#888';

    const r = 4;
    roundRect(px + pad, py + pad, size, size, r);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawCell(x, y, colorIndex, alpha = 1) {
    const img = blockImages[colorIndex];
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const pad = 1;
    const size = CELL_SIZE - pad * 2;

    if (!img) {
      drawCellFallback(x, y, colorIndex, alpha);
      return;
    }

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, px + pad, py + pad, size, size);
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBoardContents(grid, flashSet, flashPhase) {
    ctx.fillStyle = BOARD_INNER;
    ctx.fillRect(0, 0, logicalSize, logicalSize);

    // grid lines
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const p = i * CELL_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, logicalSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(logicalSize, p);
      ctx.stroke();
    }

    // center spawn hint (subtle)
    ctx.fillStyle = 'rgba(61, 139, 253, 0.06)';
    ctx.fillRect(6 * CELL_SIZE, 6 * CELL_SIZE, 3 * CELL_SIZE, 3 * CELL_SIZE);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = grid[y][x];
        if (color === 0) continue;

        let alpha = 1;
        if (flashSet && flashSet.has(`${x},${y}`)) {
          alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(flashPhase * Math.PI * 6));
        }
        drawCell(x, y, color, alpha);
      }
    }
  }

  /**
   * @param {number[][]} grid
   * @param {{
   *   flashSet?: Set<string>|null,
   *   flashPhase?: number,
   *   rotateAngle?: number,
   * }} options rotateAngle is radians; positive = clockwise visual spin
   */
  function draw(grid, options = {}) {
    if (!ctx) return;
    const {
      flashSet = null,
      flashPhase = 0,
      rotateAngle = 0,
    } = options;

    // Clear full canvas (covers corners exposed during rotation)
    ctx.save();
    ctx.setTransform(
      window.devicePixelRatio || 1,
      0,
      0,
      window.devicePixelRatio || 1,
      0,
      0
    );
    ctx.fillStyle = GRID_BG;
    ctx.fillRect(0, 0, logicalSize, logicalSize);
    ctx.restore();

    if (rotateAngle !== 0) {
      const cx = logicalSize / 2;
      const cy = logicalSize / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotateAngle);
      ctx.translate(-cx, -cy);
      drawBoardContents(grid, flashSet, flashPhase);
      ctx.restore();
      return;
    }

    drawBoardContents(grid, flashSet, flashPhase);
  }

  return { init, loadImages, draw, resize, isReady: () => imagesReady };
})();

'use strict';

const GRID_SIZE = 15;
const CELL_SIZE = 32;
const COLOR_COUNT = 4;

/** @type {readonly string[]} index 0 unused; 1..4 are block colors */
const COLORS = Object.freeze([
  '',
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f1c40f',
]);

const GRID_BG = '#0a0e14';
const GRID_LINE = '#1c2738';
const BOARD_INNER = '#111822';

const SPAWN_SCORE = 10;
const CLEAR_BASE = 10;

const FALL_INTERVAL_MS = 500;
const GRAVITY_STEP_MS = 55;
const CLEAR_FLASH_MS = 280;
const ROTATE_ANIM_MS = 320;

const GameState = Object.freeze({
  SPAWNING: 'SPAWNING',
  PLAYING: 'PLAYING',
  ROTATING: 'ROTATING',
  FALLING: 'FALLING',
  CLEARING: 'CLEARING',
  GAME_OVER: 'GAME_OVER',
});

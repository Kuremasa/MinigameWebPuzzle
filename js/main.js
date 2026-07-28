'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('game-canvas not found');
    return;
  }

  Renderer.init(canvas);
  Game.bindInput();

  Renderer.loadImages().then(() => {
    Game.start();
  });
});

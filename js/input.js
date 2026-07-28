'use strict';

const Input = (() => {
  let handlers = null;
  let buttons = {};

  function init(cbs) {
    handlers = cbs;
    buttons = {
      left: document.getElementById('btn-rotate-left'),
      drop: document.getElementById('btn-drop'),
      right: document.getElementById('btn-rotate-right'),
      restart: document.getElementById('btn-restart'),
    };

    bind(buttons.left, () => handlers.onRotateLeft && handlers.onRotateLeft());
    bind(buttons.drop, () => handlers.onHardDrop && handlers.onHardDrop());
    bind(buttons.right, () => handlers.onRotateRight && handlers.onRotateRight());
    bind(buttons.restart, () => handlers.onRestart && handlers.onRestart());
  }

  function bind(el, fn) {
    if (!el) return;
    const fire = (e) => {
      e.preventDefault();
      fn();
    };
    el.addEventListener('pointerdown', fire);
  }

  function setControlsEnabled(enabled) {
    const list = [buttons.left, buttons.drop, buttons.right];
    for (const btn of list) {
      if (btn) btn.disabled = !enabled;
    }
  }

  return { init, setControlsEnabled };
})();

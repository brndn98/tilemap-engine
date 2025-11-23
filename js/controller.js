export const INPUT = {
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UP: "UP",
  DOWN: "DOWN",
  DEBUG: "DEBUG",
  CAMERA: "CAMERA",
};

const KEYMAP = {
  ArrowLeft: INPUT.LEFT,
  ArrowRight: INPUT.RIGHT,
  ArrowUp: INPUT.UP,
  ArrowDown: INPUT.DOWN,
  q: INPUT.DEBUG,
  Q: INPUT.DEBUG,
  Control: INPUT.DEBUG,
  c: INPUT.CAMERA,
  C: INPUT.CAMERA,
};

export class Controller {
  constructor() {
    this.input = [];

    window.addEventListener("keydown", (event) => {
      if (!KEYMAP.hasOwnProperty(event.key)) return;
      this.keyPressed(event.key);
    });
    window.addEventListener("keyup", (event) => {
      if (!KEYMAP.hasOwnProperty(event.key)) return;
      this.keyReleased(event.key);
    });

    // hack for buttons
    const buttons = document.querySelectorAll(".buttons button");
    buttons.forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        if (!KEYMAP.hasOwnProperty(button.dataset.key)) return;
        this.keyPressed(button.dataset.key);
      });
      button.addEventListener("pointerup", (event) => {
        if (!KEYMAP.hasOwnProperty(button.dataset.key)) return;
        this.keyReleased(button.dataset.key);
      });
    });
  }

  keyPressed(key) {
    if (!this.input.includes(KEYMAP[key])) {
      this.input.unshift(KEYMAP[key]);
    }
    console.log(this.input);
  }

  keyReleased(key) {
    if (this.input.includes(KEYMAP[key])) {
      this.input.splice(this.input.indexOf(KEYMAP[key]), 1);
    }
  }

  get currentInput() {
    return this.input[0];
  }
}

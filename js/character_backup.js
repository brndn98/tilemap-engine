import { Sprite } from "./sprite.js";
import { INPUT } from "./controller.js";

export class Character extends Sprite {
  constructor({
    game,
    spritesheet,
    position,
    scale,
    speed,
    tileSize,
    animations,
  }) {
    super({ spritesheet, position, scale, tileSize, animations });
    this.game = game;
    this.speed = speed ?? 1;
  }

  update(input, deltaTime) {
    // todo: fix useless translate attempt on first frame after entering input
    // prevent updating movement when idle
    if (!this.moving && !input) return;
    // store the position for the tile to move into
    // * right after an input is entered the target tile will be the same as the current tile, so there is no actual movement in the first frame
    // * - try to get the actual new target
    const nextPosition = { x: this.targetPosition.x, y: this.targetPosition.y };
    if (
      this.position.x === nextPosition.x &&
      this.position.y === nextPosition.y
    ) {
      this.changeTarget(input, {
        targetX: nextPosition.x,
        targetY: nextPosition.y,
      });
      this.moving = false;
    } else {
      // calculate speed as pixels per second
      const scaledSpeed = this.speed * (deltaTime / 1000);
      // start moving into the target tile and retrieve the remaining distance in pixels to its position after each frame
      const translateDistance = this.moveTo(this.targetPosition, scaledSpeed);
      // the character will be moving as long as there is still distance to translate
      this.moving = translateDistance >= scaledSpeed;
    }
    // change the animation corresponding to the direction
    if (!this.moving && input) {
      const lastAnimation = this.animation;
      this.animation = input;
      if (lastAnimation != input) this.stop(1);
    }
    // play the current sprite animation, according to its speed settings
    if (this.frameTimer < this.frameDuration) {
      this.frameTimer += deltaTime;
      console.log(this.frameTimer);
    } else {
      this.frameTimer = 0;
      this.playback();
    }
    // set the position for the next tile to move into based on the input received
    // only when the character has stopped moving
    if (this.moving) return;
    this.changeTarget(input, {
      targetX: nextPosition.x,
      targetY: nextPosition.y,
    });
    // reset the sprite animation to the start once the character stops moving and no input is yet entered
    if (!input) {
      this.stop(1);
      this.playback(); // * workaround to render the selected frame with the current stop playback logic
    }
  }

  changeTarget(direction, { targetX, targetY }) {
    // store the direction of the target tile to move into
    // it remains zero when no input is entered at the time the sprite stops moving
    const translate = { x: 0, y: 0 };
    switch (direction) {
      case INPUT.LEFT:
        translate.x = -1;
        break;
      case INPUT.RIGHT:
        translate.x = 1;
        break;
      case INPUT.UP:
        translate.y = -1;
        break;
      case INPUT.DOWN:
        translate.y = 1;
        break;
    }
    // the next tile position is calculated by adding/subtracting the pixels of a tile to the current tile position
    // the adding/subtracting depends on the translate direction
    this.targetPosition.x = targetX + translate.x * this.tileSize;
    this.targetPosition.y = targetY + translate.y * this.tileSize;
  }
}

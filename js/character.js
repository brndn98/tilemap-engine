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
    frameDuration,
  }) {
    super({
      spritesheet,
      position,
      scale,
      tileSize,
      animations,
      frameDuration,
    });
    this.game = game;
    this.speed = speed ?? 1;
  }

  update(input, deltaTime, collisions) {
    // todo: create animation class to hold animation related properties, like the starting frame that could be optionally set
    // prevent updating movement when idle
    // reset the sprite animation to the start when idle
    if (!this.moving && !input) {
      this.stop(1);
      return;
    }
    // change the animation corresponding to the direction
    if (!this.moving && input) {
      const lastAnimation = this.animation;
      this.animation = input;
      if (lastAnimation != input) this.reset(1);
    }
    // handle the current animation frame rate
    if (this.frameTimer < this.frameDuration) {
      this.frameTimer += deltaTime;
    } else {
      this.frameTimer = 0;
      this.playback();
    }
    // set the position for the next tile to move into based on the input received
    // only when the character has stopped moving
    const nextPosition = { x: this.targetPosition.x, y: this.targetPosition.y };
    if (!this.moving) {
      // store the direction of the target tile to move into
      // it remains zero when no input is entered at the time the sprite stops moving
      const translate = { x: 0, y: 0 };
      switch (input) {
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
      nextPosition.x += translate.x * this.tileSize;
      nextPosition.y += translate.y * this.tileSize;
      // calculate the next tile position according to the collision layer
      const targetCol = nextPosition.x / this.tileSize;
      const targetRow = nextPosition.y / this.tileSize;
      // prevent the target from changing if the next tile is blocked by collisions
      if (collisions.getTileIndex(targetCol, targetRow) === 0) {
        this.targetPosition.x = nextPosition.x;
        this.targetPosition.y = nextPosition.y;
      }
    }
    // calculate speed as pixels per second
    const scaledSpeed = this.speed * (deltaTime / 1000);
    // start moving into the target tile and retrieve the remaining distance in pixels to its position after each frame
    this.moveTo(this.targetPosition, scaledSpeed);
    //const translateDistance = this.moveTo(this.targetPosition, scaledSpeed);
    //const translateDistance = this.moveTo(this.targetPosition, this.speed);
    // the character will be moving as long as there is still distance to translate
    //this.moving = translateDistance >= scaledSpeed;
    //this.moving = translateDistance >= this.speed;
    // reset the sprite animation to the start once the character stops moving and no input is yet entered
    if (!this.moving && !input) {
      this.stop(1);
    }
  }
}

export class NonPlayableCharacter extends Sprite {
  constructor({
    spritesheet,
    position,
    scale,
    speed,
    tileSize,
    animations,
    frameDuration,
  }) {
    super({
      spritesheet,
      position,
      scale,
      tileSize,
      animations,
      frameDuration,
    });
    this.speed = speed ?? 1;
  }

  update(deltaTime) {
    // handle the current animation frame rate
    if (this.frameTimer < this.frameDuration) {
      this.frameTimer += deltaTime;
    } else {
      this.frameTimer = 0;
      this.playback();
    }
  }
}

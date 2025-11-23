/* import { INPUT } from "./controller.js"; */

/* export  */ class Camera {
  constructor({ tilemap, tilesWide, tilesHigh, target }) {
    this.width = tilemap.tileSize * tilesWide;
    this.height = tilemap.tileSize * tilesHigh;
    this.position = { x: 0, y: 0 };
    this.boundaries = {
      x: tilemap.columns * tilemap.tileSize - this.width,
      y: tilemap.rows * tilemap.tileSize - this.height,
    };
    this.speed = 1;
    this.target = target ?? null;
    this.targetArea = {
      width: this.width - tilemap.tileSize,
      height: this.height - tilemap.tileSize,
    };
    this.deadzone = {
      x: this.targetArea.width / 2,
      y: this.targetArea.height / 2,
    };
    this.freeMode = false;
  }

  move({ transX, transY }, speed) {
    // the next camera position is calculated by adding/subtracting the direction to the current position
    // the adding/subtracting depends on the translate direction
    this.position.x += transX * speed;
    this.position.y += transY * speed;

    this.position.x = Math.max(0, Math.min(this.position.x, this.boundaries.x));
    this.position.y = Math.max(0, Math.min(this.position.y, this.boundaries.y));
  }

  follow({ targetX, targetY }, speed) {
    // store the next camera position, it remains the same when there is no translation
    const nextPosition = {
      x: this.position.x,
      y: this.position.y,
    };
    // when the target position gets out of the deadzone, the camera position will follow the target keeping the deadzone distance
    // when the target position is inside the deadzone, the camera still follows the target but resets to zero at the end
    if (targetX - this.position.x + this.deadzone.x > this.targetArea.width) {
      nextPosition.x = targetX - (this.targetArea.width - this.deadzone.x);
    } else if (targetX - this.deadzone.x < this.position.x) {
      nextPosition.x = targetX - this.deadzone.x;
    }
    if (targetY - this.position.y + this.deadzone.y > this.targetArea.height) {
      nextPosition.y = targetY - (this.targetArea.height - this.deadzone.y);
    } else if (targetY - this.deadzone.y < this.position.y) {
      nextPosition.y = targetY - this.deadzone.y;
    }

    nextPosition.x = nextPosition.x * speed;
    nextPosition.y = nextPosition.y * speed;

    this.position.x = Math.max(0, Math.min(nextPosition.x, this.boundaries.x));
    this.position.y = Math.max(0, Math.min(nextPosition.y, this.boundaries.y));
  }

  update(input, deltaTime) {
    if (this.target) {
      //if (!input && !this.target.moving) return;
      this.follow(
        {
          targetX: this.target.position.x,
          targetY: this.target.position.y,
        },
        this.speed
      );
      return;
    }
    if (!this.freeMode) return;
    // store the direction the camera is moving into
    // it remains zero when no input is entered
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
    this.move({ transX: translate.x, transY: translate.y }, this.speed);
  }
}

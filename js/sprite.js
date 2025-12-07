export class Spritesheet {
  constructor({ texture, x, y, width, height, offsetX, offsetY }) {
    this.texture = texture;
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.width = width ?? 16;
    this.height = height ?? 16;
    this.offsetX = offsetX ?? 0;
    this.offsetY = offsetY ?? 0;
    this.framesWide = this.texture.width / this.width;
    this.framesHigh = this.texture.height / this.height;
  }
}

export class Animation {
  constructor({ name, frames }) {
    this.name = name;
    this.frames = frames;
  }
}

export class Sprite {
  constructor({
    spritesheet,
    position,
    scale,
    tileSize,
    animations,
    frameDuration,
  }) {
    this.tileSize = tileSize ?? 16;
    this.spritesheet = spritesheet ?? new Spritesheet({ texture: "" });
    this.scale = scale ?? 1;

    this.moving = false;
    this.position = position ?? { x: 0, y: 0 };
    this.targetPosition = { x: this.position.x, y: this.position.y };
    this.translate = { x: 0, y: 0 };

    // set sprite dimensions on canvas based on a spritesheet frame
    this.width = this.spritesheet.width * this.scale;
    this.height = this.spritesheet.height * this.scale;

    // sprite animations
    this.animations = {};
    animations?.forEach((animation, index) => {
      const frames = animation.frames ?? [];
      // when a frame range is not present the animation holds all the frames in the spritesheet
      if (!frames.length) {
        const totalFrames =
          this.spritesheet.framesWide * this.spritesheet.framesHigh;
        for (let frame = 0; frame < totalFrames; frame++) {
          frames.push(frame);
        }
      }
      this.animations[animation.name ?? `anim_${index}`] = {
        name: animation.name ?? `anim_${index}`,
        frames: frames,
      };
    });
    this.currentAnimation = null;
    this.currentFrame = 0;
    // time in miliseconds
    this.frameDuration = frameDuration ?? 145;
    this.frameTimer = this.frameDuration; // * workaround for the current animation loop logic, starts playing before the timer starts counting
  }

  moveTo(targetPosition, speed) {
    // store the pixels it takes to reach the target position
    this.translate.x = targetPosition.x - this.position.x;
    this.translate.y = targetPosition.y - this.position.y;
    const distance = Math.hypot(this.translate.x, this.translate.y);
    // when there is no more pixels left to translate, jump directly into the target to snap the sprite position
    // then exit along with the remaining pixel amount
    if (distance <= speed) {
      this.position.x = targetPosition.x;
      this.position.y = targetPosition.y;
      // return distance;
      this.moving = false;
      return;
    }
    // when there is enough pixels left, update the current position in order to move towards the target position
    this.moving = true; // remove for free movement instead of grid based
    // store the direction of the target position to move into
    // the direction is calculated from a normalized vector between the pixels it takes to move and the pixel distance of each coord
    const direction = {
      x: this.translate.x / distance,
      y: this.translate.y / distance,
    };
    // the updated position is calculated by adding/subtracting the movement speed to the current position
    // the adding/subtracting depends on the translate direction
    this.position.x += direction.x * speed;
    this.position.y += direction.y * speed;

    // update the amount of pixels it takes to reach the target position
    // then exit along with the remaining pixel amount
    // this.translate.x = targetPosition.x - this.position.x;
    // this.translate.y = targetPosition.y - this.position.y;

    // return Math.hypot(this.translate.x, this.translate.y);
  }

  /* 
    Sets (x,y) coords from spritesheet to loop through the current animation frames
  */
  playback() {
    if (!this.currentAnimation || !this.currentAnimation.frames.length) return;

    const frameRow = Math.trunc(
      this.currentAnimation.frames[this.currentFrame] /
        this.spritesheet.framesWide
    );
    this.spritesheet.x =
      this.spritesheet.width * this.currentAnimation.frames[this.currentFrame] -
      this.spritesheet.texture.width * frameRow;
    this.spritesheet.y = this.spritesheet.height * frameRow;

    // calculate the next frame
    this.currentFrame =
      this.currentFrame < this.currentAnimation.frames.length - 1
        ? this.currentFrame + 1
        : 0;
  }

  reset(atFrame = 0) {
    if (
      !this.currentAnimation ||
      atFrame >= this.currentAnimation.frames.length
    )
      return;
    this.currentFrame = atFrame;
    this.frameTimer = this.frameDuration;
  }

  stop(atFrame = 0) {
    // stopping plays the next frame of the animation after resetting it, which updates the current frame at the end
    // prevent updating the frame when the next frame has already been played
    if (this.currentFrame === atFrame + 1) return;
    this.reset(atFrame);
    this.playback();
  }

  drawHitbox(canvas, camera) {
    const latestFillStyle = canvas.fillStyle;
    canvas.fillStyle = "#0325ab";
    canvas.fillRect(
      this.position.x - camera.position.x,
      this.position.y - camera.position.y,
      this.tileSize * this.scale,
      this.tileSize * this.scale
    );
    canvas.fillStyle = latestFillStyle;
  }

  drawTarget(canvas, camera) {
    if (!this.moving) return;
    const latestStrokeStyle = canvas.strokeStyle;
    canvas.strokeStyle = "#c20262";
    canvas.strokeRect(
      this.targetPosition.x - camera.position.x,
      this.targetPosition.y - camera.position.y,
      this.tileSize * this.scale,
      this.tileSize * this.scale
    );
    canvas.strokeStyle = latestStrokeStyle;
  }

  drawSprite(canvas, camera) {
    canvas.drawImage(
      this.spritesheet.texture,
      this.spritesheet.x,
      this.spritesheet.y,
      this.spritesheet.width,
      this.spritesheet.height,
      this.position.x + this.spritesheet.offsetX - camera.position.x,
      this.position.y + this.spritesheet.offsetY - camera.position.y,
      this.width,
      this.height
    );
  }

  set positionX(x) {
    this.position.x = x;
    this.targetPosition.x = x;
  }
  set positionY(y) {
    this.position.y = y;
    this.targetPosition.y = y;
  }

  /* sets the current sprite animation by name */
  set animation(name) {
    if (
      !this.animations.hasOwnProperty(name) ||
      this.currentAnimation?.name === name
    )
      return;
    this.currentAnimation = this.animations[name];
    this.currentFrame = 0;
  }
  /* gets the name of the current sprite animation */
  get animation() {
    return this.currentAnimation?.name ?? null;
  }
}

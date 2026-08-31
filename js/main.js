import { CustomTilemap, Tilemap } from "./tilemap.js";
import { Camera } from "./camera.js";
import { Spritesheet, SpriteGroup } from "./sprite.js";
import { Character, NonPlayableCharacter } from "./character.js";
import { Controller, INPUT } from "./controller.js";

class Game {
  constructor(tilemap, camera, player, npcs) {
    this.tilemap = tilemap;
    this.controller = new Controller();
    this.player = player;
    this.npcs = npcs;
    // todo: implement camera following logic after the game is initialized
    this.camera = camera;

    this.debugMode = false;
    this.freeCameraMode = false;

    window.addEventListener("keydown", event => {
      // toggle debug mode
      if(this.controller.currentInput === INPUT.DEBUG) {
        this.debugMode = !this.debugMode;
      }
      // toggle camera mode
      if (this.controller.currentInput === INPUT.CAMERA) {
        this.freeCameraMode = !this.freeCameraMode;
      }
    });
    /* window.addEventListener("keyup", event => {
      if (this.keysPressed.includes(event.key)) {
        this.keysPressed.splice(this.keysPressed.indexOf(event.key), 1);
      }
    }); */
  }

  update(deltaTime) {
    this.camera.freeMode = this.freeCameraMode;
    // npcs animations
    this.npcs.forEach(npc => {
      // todo: move ufo animation to its own object class
      if (npc.id === "ufo-group") {
        // calculate speed as pixels per second
        const scaledSpeed = npc.speed * (deltaTime / 1000);
        const shipIndex = npc.sprites.findIndex(sprite => sprite.id === "ufo-ship");
        const ufoShip = npc.sprites[shipIndex];
        
        // going up
        if (npc.state === "down" && ufoShip.position.y <= 92) {
          ufoShip.positionY = ufoShip.position.y + 1 * (scaledSpeed * 13);
          if (ufoShip.position.y >= 92) npc.state = "up";
        }
        if (npc.state === "up" && ufoShip.position.y >= 86) {
          ufoShip.positionY = ufoShip.position.y - 1 * (scaledSpeed * 13);
          if (ufoShip.position.y <= 86) npc.state = "down";
        }
      }
      npc.update(deltaTime);
    });
    // character movement
    if (!this.camera.freeMode) {
      this.player.update(this.controller.currentInput, deltaTime, this.tilemap.collisions);
    }
    // camera movement, only when player is moving
    this.camera.update(this.controller.currentInput, deltaTime);
  }

  render(canvas) {
    // reverse the tilemap layer list to ascending order
    this.tilemap.layers.sort((current, next) => next.order - current.order);
    // create the sprite list to sort it based on Y position before rendering
    const spriteList = [...this.npcs, this.player];
    spriteList.sort((current, next) => current.position.y - next.position.y);
    // background and foliage layers, below everything else in the render order
    this.tilemap.drawLayer(canvas, 0, this.camera);
    this.tilemap.drawLayer(canvas, 1, this.camera);
    // grid layer, above background layer and available when debugging only
    if (this.debugMode) {
      this.tilemap.drawGrid(canvas, this.camera);
      this.tilemap.drawCollisions(canvas, this.camera);
    }
    // render sprite list
    spriteList.forEach(sprite => {
      // render sprite bounding box when debugging only
      if (this.debugMode) {
        sprite.drawHitbox(canvas, this.camera);
        if (sprite.moving) {
          sprite.drawTarget(canvas, this.camera);
        }
      }
      sprite.drawSprite(canvas, this.camera);
    });
    // foreground layer, above the player's sprite
    this.tilemap.drawLayer(canvas, 2, this.camera);
  }
}

function setupCanvas({ tilesets, tilemaps, spritesheets }) {
  // canvas for game
  const canvas = document.querySelector("canvas#game");
  const ctx = canvas.getContext("2d");
  // canvas for debug specs
  const debugCanvas = document.querySelector("canvas#debug");
  const debugCtx = debugCanvas.getContext("2d");

  // canvas settings
  ctx.imageSmoothingEnabled = false;
  // add collision layer into the tilemap data
  tilemaps.luna.collisions = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ];
  // init tilemap
  const tilemap = new Tilemap(tilesets.luna, tilemaps.luna);
  // prepare the player's character spritesheet and animation data
  const playerSheet = new Spritesheet({
    texture: spritesheets.marciano,
    x: 0,
    y: 0,
    width: 16,
    height: 32,
    offsetY: -16
  });
  const playerAnimations = [
    { name: INPUT.RIGHT, frames: [12,13,14,15] },
    { name: INPUT.LEFT, frames: [8,9,10,11] },
    { name: INPUT.UP, frames: [4,5,6,7] },
    { name: INPUT.DOWN, frames: [0,1,2,3] }
  ];
  // init player sprite
  const player = new Character({ spritesheet: playerSheet, animations: playerAnimations, speed: 24 });
  //const player = new Character({ spritesheet: playerSheet, animations: playerAnimations, speed: 1 });
  // set character initial position and frame 
  player.positionY = 6 * tilemap.tileSize;
  player.positionX = 3 * tilemap.tileSize;
  player.animation = INPUT.DOWN;
  player.stop(1);
  // prepare the npc spritesheet and animation data
  const npcSheet = new Spritesheet({
    texture: spritesheets.gato,
    x: 0,
    y: 0,
    width: 16,
    height: 24,
    offsetY: -10
  });
  const npcAnimations = [{ name: "dance" }];
  // init npc sprite
  const npc = new NonPlayableCharacter({ spritesheet: npcSheet, animations: npcAnimations, speed: 1, frameDuration: 100 });
  // set npc initial position
  npc.positionY = 12 * tilemap.tileSize;
  npc.positionX = 10 * tilemap.tileSize;
  npc.animation = "dance";
  // ufo spritesheet
  const ufoSheet = new Spritesheet({
    texture: spritesheets.ovni,
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    offsetY: -3
  });
  const ufoAnimations = [
    { name: "hover", totalFrames: 18 },
    { name: "shadow-hover", frames: [18, 19, 20, 21, 22, 23, 24, 25] }
  ];
  // init ufo sprite
  const ufo = new NonPlayableCharacter({ id: "ufo-ship", spritesheet: ufoSheet, animations: ufoAnimations, speed: 1, frameDuration: 100 });
  // set ufo initial position
  ufo.positionY = ufo.position.y - 5;
  /* ufo.positionX = 1 * tilemap.tileSize; */
  ufo.animation = "hover";
  // ufo spritesheet
  const ufoShadowSheet = new Spritesheet({
    texture: spritesheets.ovni,
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    offsetY: -3
  });
  // init ufo shadow sprite
  const ufoShadow = new NonPlayableCharacter({ id: "ufo-shadow", spritesheet: ufoShadowSheet, animations: ufoAnimations, speed: 1, frameDuration: 100 });
  // set ufo initial position
  /* ufoShadow.positionY = 13 * tilemap.tileSize;
  ufoShadow.positionX = 9 * tilemap.tileSize; */
  ufoShadow.animation = "shadow-hover";

  // * experimental - sprite group
  const ufoGroup = new SpriteGroup({ id: 'ufo-group', sprites: [ufo, ufoShadow] });
  ufoGroup.positionX = 1 * tilemap.tileSize;
  ufoGroup.positionY = 6 * tilemap.tileSize;
  ufoGroup.state = "up";

  // init camera, and set its target to follow the player
  // * force squared camera
  const CAMERA_TILES_WIDE = 10;
  const camera = new Camera({ tilemap: tilemap, tilesWide: CAMERA_TILES_WIDE, tilesHigh: CAMERA_TILES_WIDE, speed: player.speed, target: player});
  // set npcs
  const npcs = [];
  npcs.push(npc);
  //npcs.push(ufo);
  //npcs.push(ufoShadow);
  npcs.push(ufoGroup);
  // init game
  const game = new Game(tilemap, camera, player, npcs);

  // update canvas dimensions based on game settings
  canvas.width = camera.width;
  canvas.height = camera.height;
  console.log(canvas.width, canvas.height);

  let lastTimestamp = 0;
  function animate(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    const fps = deltaTime / 1000;
    lastTimestamp = timestamp;
    game.update(deltaTime);
    game.render(ctx);
    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    drawSpecs(debugCtx, [
      { name: "deltaTime", value: deltaTime },
      { name: "FPS", value: fps }
    ]);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function drawSpecs(canvas, specs) {
  if (!specs.length) return;

  canvas.font = "bold 16px monospace";
  canvas.fillStyle = "#016137";
  canvas.textBaseline = "top";
  specs.forEach((spec, index) => {
    const offsetY = 10 + 20 * index;
    canvas.fillText(`${spec.name}: ${spec.value}`, 10, offsetY);
  });
}

function trackLoadedResources(resources, count) {
  if (Object.keys(resources.tilesets).length === count.tilesets &&
      Object.keys(resources.tilemaps).length === count.tilemaps &&
      Object.keys(resources.spritesheets).length === count.spritesheets)
    {
      setupCanvas(resources);
    }
}

function loadTexture(texture, textureStack, loaded) {
  const image = new Image();
  image.onload = function () {
    textureStack[texture.name] = this;
    // once every texture is loaded, run the callback to handle the resource
    loaded(textureStack[texture.name]);
  };
  image.src = texture.src;
}

function loadResources({ tilesets = [], tilemaps = [], spritesheets = [] }) {
  // load every tileset texture and store the loaded images to use in canvas
  const resourcesToLoad = { tilesets: tilesets.length, tilemaps: tilemaps.length, spritesheets: spritesheets.length };
  const resourcesLoaded = { tilesets: { }, tilemaps: { }, spritesheets: {} };
  
  tilesets.forEach((tileset) => {
    loadTexture(tileset, resourcesLoaded.tilesets, (texture) => {
      trackLoadedResources(resourcesLoaded, resourcesToLoad);
    });
  });
  
  tilemaps.forEach(async tilemap => {
    const request = new Request(tilemap.src);
    const response = await fetch(request);
    const data = await response.json();
    resourcesLoaded.tilemaps[tilemap.name] = data;
    // once every tilemap data is loaded, check for the loaded resources and then setup the canvas
      trackLoadedResources(resourcesLoaded, resourcesToLoad);
  });

  spritesheets.forEach(spritesheet => {
    loadTexture(spritesheet, resourcesLoaded.spritesheets, (texture) => {
      trackLoadedResources(resourcesLoaded, resourcesToLoad);
    });
  });
}

window.addEventListener("load", () => {
  const resources = {
    tilesets: [
      { name: "luna", src: "./assets/tilesets/la-luna-proto-sheet.png" },
    ],
    tilemaps: [
      { name: "luna", src: "./assets/tilemaps/la-luna-proto-sheet.json"}
    ],
    spritesheets: [
      { name: "marciano", src: "./assets/spritesheets/marcianito-proto-sheet.png" },
      { name: "gato", src: "./assets/spritesheets/gato-marciano-sheet.png" },
      { name: "ovni", src: "./assets/spritesheets/ovni-proto-sheet.png" }
    ]
  };
  loadResources(resources);
});
class Tileset {
  constructor(texture, tileSize) {
    this.texture = texture;
    this.width = this.texture.width;
    this.height = this.texture.height;
    this.tileSize = tileSize;
    this.columns = this.width / this.tileSize;
  }
}

class TilemapLayer {
  constructor(name, tiles, columns, order) {
    this.name = name;
    this.tiles = tiles;
    this.columns = columns;
    this.order = order;
  }

  getTileIndex(col, row) {
    return this.tiles[row * this.columns + col];
  }
}

export class Tilemap {
  constructor(tileset, data) {
    this.columns = data.tileswide;
    this.rows = data.tileshigh;
    this.tileSize = data.tilewidth;
    // handle camera calculations
    this.halfTileSize = this.tileSize / 2;
    this.tileset = new Tileset(tileset, data.tilewidth);
    this.layers = data.layers.map((layer, index) => {
      const tiles = layer.tiles.map((tile) => tile.tile);
      return new TilemapLayer(layer.name, tiles, this.columns, index);
    });
    this.collisions = data.hasOwnProperty("collisions")
      ? new TilemapLayer(
          "collisions",
          data.collisions,
          this.columns,
          this.layers.length
        )
      : null;
  }

  drawGrid(canvas, camera) {
    // define visible grid area relative to the camera dimensions
    const firstRow = Math.floor(camera.position.y / this.tileSize);
    const lastRow = firstRow + camera.height / this.tileSize;
    const firstColumn = Math.floor(camera.position.x / this.tileSize);
    const lastColumn = firstColumn + camera.width / this.tileSize;
    // set grid offset relative to camera position and viewport
    const offsetX = -camera.position.x + firstColumn * this.tileSize;
    const offsetY = -camera.position.y + firstRow * this.tileSize;

    canvas.save();
    canvas.strokeStyle = "#1c1c1c";
    for (let row = firstRow; row <= lastRow; row++) {
      for (let col = firstColumn; col <= lastColumn; col++) {
        // set the final rendered position for the tile
        const finalX = (col - firstColumn) * this.tileSize + offsetX;
        const finalY = (row - firstRow) * this.tileSize + offsetY;
        // render a tile border to compose a visible grid for debug
        canvas.strokeRect(
          Math.round(finalX),
          Math.round(finalY),
          this.tileSize,
          this.tileSize
        );
      }
    }
    canvas.restore();
  }

  drawLayer(canvas, layer, camera) {
    if (layer < 0 || layer >= this.layers.length) return;
    // define visible tilemap area relative to the camera dimensions
    const firstRow = Math.floor(camera.position.y / this.tileSize);
    const lastRow = firstRow + camera.height / this.tileSize;
    const firstColumn = Math.floor(camera.position.x / this.tileSize);
    const lastColumn = firstColumn + camera.width / this.tileSize;
    // set tilemap offset relative to camera position and viewport
    const offsetX = -camera.position.x + firstColumn * this.tileSize;
    const offsetY = -camera.position.y + firstRow * this.tileSize;

    // loop through the map rows and columns to build a grid and render the tilemap
    for (let row = firstRow; row <= lastRow; row++) {
      for (let col = firstColumn; col <= lastColumn; col++) {
        // get tile index from the tileset corresponding to the map layer structure
        const tileIndex = this.layers[layer].getTileIndex(col, row);
        if (tileIndex < 0) continue;
        // set the final rendered position for the tile
        const finalX = (col - firstColumn) * this.tileSize + offsetX;
        const finalY = (row - firstRow) * this.tileSize + offsetY;
        // render a tile assigned to the layer at the current position
        canvas.drawImage(
          this.tileset.texture,
          (tileIndex * this.tileset.tileSize) % this.tileset.width,
          Math.floor(tileIndex / this.tileset.columns) * this.tileset.tileSize,
          this.tileset.tileSize,
          this.tileset.tileSize,
          Math.round(finalX),
          Math.round(finalY),
          this.tileSize,
          this.tileSize
        );
      }
    }
  }

  drawCollisions(canvas, camera) {
    if (!this.collisions) return;
    // define visible tilemap area relative to the camera dimensions
    const firstRow = Math.floor(camera.position.y / this.tileSize);
    const lastRow = firstRow + camera.height / this.tileSize;
    const firstColumn = Math.floor(camera.position.x / this.tileSize);
    const lastColumn = firstColumn + camera.width / this.tileSize;
    // set tilemap offset relative to camera position and viewport
    const offsetX = -camera.position.x + firstColumn * this.tileSize;
    const offsetY = -camera.position.y + firstRow * this.tileSize;

    canvas.save();
    canvas.fillStyle = "#fcc603";
    for (let row = firstRow; row <= lastRow; row++) {
      for (let col = firstColumn; col <= lastColumn; col++) {
        // get tile index corresponding to the collision layer structure
        const tileIndex = this.collisions.getTileIndex(col, row);
        if (tileIndex <= 0) continue;
        // set the final rendered position for the tile
        const finalX = (col - firstColumn) * this.tileSize + offsetX;
        const finalY = (row - firstRow) * this.tileSize + offsetY;
        // render a collision tile assigned to the tilemap
        canvas.fillRect(
          Math.round(finalX),
          Math.round(finalY),
          this.tileSize,
          this.tileSize
        );
      }
    }
    canvas.restore();
  }
}

export class CustomTilemap {
  constructor(tileset, layers, columns = 10, rows = 10, tileSize = 32) {
    this.columns = columns;
    this.rows = rows;
    this.tileSize = tileSize;
    this.tileset = new Tileset(tileset, 16);
    this.layers = layers.map(
      (layer, index) =>
        new TilemapLayer(
          layer.name,
          layer.tiles,
          this.columns,
          layer.order || index
        )
    );
  }

  drawLayer(canvas, layer) {
    // prevent from drawing if the layer does not exist in the tilemap
    if (layer >= this.layers.length) return;
    // loop through the map rows and columns to build a grid and render the tilemap
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        // get tile index from the tileset corresponding to the map layer structure
        const tileIndex = this.layers[layer].getTileIndex(col, row);
        // render a tile assigned to the grid
        canvas.drawImage(
          this.tileset.texture,
          (tileIndex * this.tileset.tileSize) % this.tileset.width,
          Math.floor(tileIndex / this.tileset.columns) * this.tileset.tileSize,
          this.tileset.tileSize,
          this.tileset.tileSize,
          col * this.tileSize,
          row * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }
  }

  drawGrid(canvas) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        // render a tile border to compose a visible grid for debug
        canvas.strokeRect(
          col * this.tileSize,
          row * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }
  }
}

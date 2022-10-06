import { gfx2Manager } from '../gfx2/gfx2_manager';
import { gfx2TextureManager } from '../gfx2/gfx2_texture_manager';

class Gfx2Map {
  rows: number;
  columns: number;
  tileHeight: number;
  tileWidth: number;
  tileLayers: Array<Gfx2TileLayer>;
  tileset: Gfx2Tileset;

  constructor() {
    this.rows = 0;
    this.columns = 0;
    this.tileHeight = 0;
    this.tileWidth = 0;
    this.tileLayers = [];
    this.tileset = new Gfx2Tileset();
  }

  async loadFromFile(path: string): Promise<void> {
    let response = await fetch(path);
    let json = await response.json();

    this.rows = json['Rows'];
    this.columns = json['Columns'];
    this.tileHeight = json['TileHeight'];
    this.tileWidth = json['TileWidth'];

    this.tileLayers = [];
    for (let obj of json['Layers']) {
      let tileLayer = new Gfx2TileLayer();
      await tileLayer.loadFromData(obj);
      this.tileLayers.push(tileLayer);
    }

    this.tileset = new Gfx2Tileset();

    if (json['Tileset']) {
      await this.tileset.loadFromData(json['Tileset']);
    }
  }

  getHeight(): number {
    return this.rows * this.tileHeight;
  }

  getWidth(): number {
    return this.columns * this.tileWidth;
  }

  getRows(): number {
    return this.rows;
  }

  getColumns(): number {
    return this.columns;
  }

  getTileHeight(): number {
    return this.tileHeight;
  }

  getTileWidth(): number {
    return this.tileWidth;
  }

  getTileLayer(index: number): Gfx2TileLayer {
    return this.tileLayers[index];
  }

  findTileLayer(name: string): Gfx2TileLayer | undefined {
    return this.tileLayers.find(tileLayer => tileLayer.getName() == name);
  }

  getTileset(): Gfx2Tileset {
    return this.tileset;
  }

  getPositionX(col: number): number {
    return col * this.tileWidth;
  }

  getPositionY(row: number): number {
    return row * this.tileHeight;
  }

  getLocationCol(x: number): number {
    return Math.floor(x / this.tileWidth);
  }

  getLocationRow(y: number): number {
    return Math.floor(y / this.tileHeight);
  }
}

class Gfx2TileLayer {
  name: string;
  rows: number;
  columns: number;
  visible: boolean;
  frameDuration: number;
  grid: Array<number>;

  constructor() {
    this.name = '';
    this.rows = 0;
    this.columns = 0;
    this.visible = true;
    this.frameDuration = 0;
    this.grid = [];
  }

  async loadFromData(data: any): Promise<void> {
    this.name = data['Name'];
    this.rows = data['Rows'];
    this.columns = data['Columns'];
    this.visible = data['Visible'];
    this.frameDuration = data['FrameDuration'];
    this.grid = data['Grid'];
  }

  getTile(col: number, row: number) {
    return this.grid[col + (row * this.columns)];
  }

  getName(): string {
    return this.name;
  }

  getRows(): number {
    return this.rows;
  }

  getColumns(): number {
    return this.columns;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getFrameDuration(): number {
    return this.frameDuration;
  }

  getGrid(): Array<number> {
    return this.grid;
  }
}

class Gfx2Tileset {
  columns: number;
  tileWidth: number;
  tileHeight: number;
  texture: ImageBitmap | HTMLImageElement;
  animations: Map<number, Array<number>>;

  constructor() {
    this.columns = 0;
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.texture = gfx2Manager.getDefaultTexture();
    this.animations = new Map<number, Array<number>>;
  }

  async loadFromData(data: any): Promise<void> {
    this.columns = parseInt(data['Columns']);
    this.tileWidth = parseInt(data['TileWidth']);
    this.tileHeight = parseInt(data['TileHeight']);
    this.texture = await gfx2TextureManager.loadTexture(data['TextureFile']);

    this.animations.clear();
    for (const tileId in data['Animations']) {
      this.animations.set(parseInt(tileId), data['Animations'][tileId] ?? []);
    }
  }

  getTilePositionX(tileId: number): number {
    return ((tileId - 1) % this.columns) * this.tileWidth;
  }

  getTilePositionY(tileId: number): number {
    return Math.floor((tileId - 1) / this.columns) * this.tileHeight;
  }

  getTileHeight(): number {
    return this.tileHeight;
  }

  getTileWidth(): number {
    return this.tileWidth;
  }

  getColumns(): number {
    return this.columns;
  }

  getTexture(): ImageBitmap | HTMLImageElement {
    return this.texture;
  }

  getAnimation(tileId: number): Array<number> | undefined {
    return this.animations.get(tileId);
  }
}

export { Gfx2Map };
import { Injectable } from '@gg/injection';
import { CanvasTexture } from 'three/src/Three.js';
import { SpriteComponent } from './sprite.component';

export
@Injectable()
class CanvasSpriteComponent extends SpriteComponent {
  private _size = 128;
  get size() {
    return this._size;
  }
  set size(size: number) {
    this._size = size;
    this.resize();
  }

  private _domElement?: HTMLCanvasElement;

  get domElement() {
    if (!this._domElement) {
      this._domElement = document.createElement('canvas');
      this.resize();
    }

    return this._domElement!;
  }

  private setNeedsUpdate() {
    if (this.spriteMaterial) {
      this.spriteMaterial.needsUpdate = true;
    }
    if (this.map) {
      this.map.needsUpdate = true;
    }
  }

  resize() {
    const { _domElement } = this;
    if (!_domElement) return;
    _domElement.width = this._size;
    _domElement.height = this._size;
    this.setNeedsUpdate();
  }

  draw(composer: (canvas: CanvasSpriteComponent) => void) {
    composer(this);
    this.setNeedsUpdate();
  }

  private _context?: CanvasRenderingContext2D;

  get context() {
    if (!this._context) {
      this._context = this.domElement.getContext('2d') ?? undefined;
      if (!this._context) {
        throw Error(`2d canvas not supported`);
      }
    }

    return this._context!;
  }

  async init() {
    await super.init();
    this.map = new CanvasTexture(this.domElement);
  }
}

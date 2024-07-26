import { Component, RegisteredComponent, sibling } from "@gg/component";
import { CanvasTexture } from "three/src/Three.js";
import { Sprite } from "./sprite.component";

export @RegisteredComponent() class CanvasSprite extends Component {
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

  @sibling(Sprite) sprite!: Sprite;

  resize() {
    const { _domElement } = this;
    if (!_domElement) return;
    _domElement.width = this._size;
    _domElement.height = this._size;
    if (this?.sprite?.spriteMaterial) {
      this.sprite.spriteMaterial.needsUpdate = true;
    }
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
    this.sprite.map = new CanvasTexture(this.domElement);
  }
}
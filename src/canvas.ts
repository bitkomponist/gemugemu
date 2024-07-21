import { Vector2 } from "./math";
import { Transform } from "./transform.component";

export class Canvas {
  private canvas: HTMLCanvasElement;
  #context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.backgroundColor = '#000';
    document.querySelector('#app')!.appendChild(this.canvas);
    this.#context = this.canvas.getContext('2d')!;
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  get context() {
    return this.#context;
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  applyTransform(t: { position: Vector2, scale: Vector2, rotation: number }) {
    const { x, y } = t.position;
    const { x: scaleX, y: scaleY } = t.scale;
    this.context.translate(x, y);
    this.context.scale(scaleX, scaleY);
    this.context.rotate(t.rotation);
  }
}
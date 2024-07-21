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

  applyTransform(t: Transform) {
    const { x, y } = t.position;
    const { x: scaleX, y: scaleY } = t.scale;
    const { x: pX, y: pY } = t.pivot;
    this.context.translate(x, y);
    this.context.translate(pX, pY);
    this.context.rotate(t.rotation);
    this.context.translate(pX * -1, pY * -1);
    this.context.scale(scaleX, scaleY);

  }
}
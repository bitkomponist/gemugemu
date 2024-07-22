import { Vector2 } from './math';
export class Canvas {
  #canvas: HTMLCanvasElement;
  #context: CanvasRenderingContext2D;

  constructor({
    width = 800,
    height = 600,
    clearColor = '#000',
    selector,
  }: {
    width?: number;
    height?: number;
    clearColor?: string;
    selector?: string;
  } = {}) {
    this.#canvas = document.createElement('canvas');
    this.#canvas.width = width;
    this.#canvas.height = height;
    this.#canvas.style.backgroundColor = clearColor;
    this.#context = this.#canvas.getContext('2d')!;
    if (selector) {
      document.querySelector('#app')?.appendChild(this.#canvas);
    }
  }

  get htmlElement() {
    return this.#canvas;
  }

  get width() {
    return this.#canvas.width;
  }

  get height() {
    return this.#canvas.height;
  }

  get context() {
    return this.#context;
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  applyTransform(t: { position: Vector2; scale: Vector2; rotation: number }) {
    const { x, y } = t.position;
    const { x: scaleX, y: scaleY } = t.scale;
    this.context.translate(x, y);
    this.context.scale(scaleX, scaleY);
    this.context.rotate(t.rotation);
  }
}

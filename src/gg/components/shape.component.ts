import { Canvas } from '../canvas';
import { Component, RegisteredComponent } from '../component';
import { Vector2 } from '../math';
import { Renderer2d } from '../systems/renderer-2d.system';

export
@RegisteredComponent()
class Shape extends Component {
  fill?: CanvasRenderingContext2D['fillStyle'];
  stroke?: CanvasRenderingContext2D['strokeStyle'];
  lineWidth?: CanvasRenderingContext2D['lineWidth'];
  path?: string;
  cache?: Vector2;
  #canvas?: Canvas;
  #dirty = true;

  getCanvas() {
    if (!this.#canvas && this.cache) {
      this.#canvas = new Canvas({ width: this.cache.x, height: this.cache.y });
    }

    return this.#canvas;
  }

  drawSegment(context: CanvasRenderingContext2D, segment: string) {
    const [type, ...args] = segment.split(' ');
    const nArgs = args.map((s) => Number(s));
    switch (type) {
      case 'm':
        {
          const [x = 0, y = 0] = nArgs;
          context.moveTo(x, y);
        }
        break;
      case 'l':
        {
          const [x = 0, y = 0] = nArgs;
          context.lineTo(x, y);
        }
        break;
      case 'b':
        {
          const [cp1x = 0, cp1y = 0, cp2x = 0, cp2y = 0, x = 0, y = 0] = nArgs;
          context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        }
        break;
      case 'a':
        {
          const [x1 = 0, y1 = 0, x2 = 0, y2 = 0, radius = 0] = nArgs;
          context.arcTo(x1, y1, x2, y2, radius);
        }
        break;
      case 'c':
        {
          const [cpx = 0, cpy = 0, x = 0, y = 0] = nArgs;
          context.quadraticCurveTo(cpx, cpy, x, y);
        }
        break;
      default:
    }
  }

  drawPath(path: string, context: CanvasRenderingContext2D) {
    context.beginPath();

    for (const segment of path.split(/(?=[a-z])/)) {
      this.drawSegment(context, segment.trim());
    }

    context.closePath();

    if (this.lineWidth) {
      context.lineWidth = this.lineWidth;
    }

    if (this.fill) {
      context.fillStyle = this.fill;
      context.fill();
    }

    if (this.stroke) {
      context.strokeStyle = this.stroke;
      context.stroke();
    }
  }

  render2d(renderer: Renderer2d): void {
    if (!this.path) {
      return;
    }
    const { context } = this.cache ? this.getCanvas()! : renderer.canvas;
    if (!this.cache || this.#dirty) {
      this.drawPath(this.path, context);
      this.#dirty = false;
    }
    if (this.cache) {
      renderer.canvas.context.drawImage(this.getCanvas()!.htmlElement, 0, 0);
    }
  }
}

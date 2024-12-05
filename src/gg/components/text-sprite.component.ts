import { Injectable } from '@gg/injection';
import { CanvasSpriteComponent } from './canvas-sprite.component';

export
@Injectable()
class TextSpriteComponent extends CanvasSpriteComponent {
  private _text: string = '';
  get text() {
    return this._text;
  }
  set text(text: string) {
    if (text === this._text) return;
    this._text = text;
    this.drawText();
  }

  private _font: string = '32px sans-serif';
  get font() {
    return this._font;
  }
  set font(font: string) {
    if (font === this._font) return;
    this._font = font;
    this.drawText();
  }

  private _fill: string = '#888888';

  get fill() {
    return this._fill;
  }

  set fill(fill: string) {
    if (fill === this._fill) return;
    this._fill = fill;
    this.drawText();
  }

  public drawText() {
    this.draw(({ context, size }) => {
      context.clearRect(0, 0, size, size);
      context.fillStyle = this._fill;
      context.font = this._font;
      context.textRendering = 'geometricPrecision';
      context.fillText(this._text, size * 0.5, size * 0.5);
    });
  }

  async init() {
    await super.init();
    this.drawText();
  }
}

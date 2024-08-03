import { Injectable } from '@gg/injection';
import { System } from '../system';

export
@Injectable()
class InputManagerSystem extends System {
  state = new Map<string, boolean>();

  initRoot(): void {
    this.state = new Map();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destructRoot(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.state.set(e.key, false);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    console.log(e.key);
    this.state.set(e.key, true);
  };

  isKeyPressed(key: string) {
    return this.state.get(key) === true;
  }
}

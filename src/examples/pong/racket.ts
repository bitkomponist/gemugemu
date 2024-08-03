import { Component, sibling } from '@gg/component';
import { CanvasSpriteComponent } from '@gg/components/canvas-sprite.component';
import { TransformComponent } from '@gg/components/transform.component';
import { EntityDescriptor } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { Prefab } from '@gg/prefab';
import { InputManagerSystem } from '@gg/systems/input-manager.system';
import { Vector3, Vector3Like } from 'three/src/Three.js';
import { Collider } from './collision';

@Injectable()
export class PongRacket extends Component {
  private positionTarget = new Vector3();
  private initialPosition = new Vector3();
  speed = 0.1;
  dampening = 1;
  impulse = 0;
  @sibling(TransformComponent) transform!: TransformComponent;
  @sibling(CanvasSpriteComponent) canvas!: CanvasSpriteComponent;

  reset() {
    this.transform.position.copy(this.initialPosition);
    this.positionTarget.copy(this.initialPosition);
  }

  init(): void {
    this.initialPosition.copy(this.transform.position);
    const { context } = this.canvas;
    // context.fillStyle = '#111111';
    // context.fillRect(0, 0, this.canvas.size, this.canvas.size);
    context.fillStyle = '#ffffff';
    context.fillRect(this.canvas.size / 3, 0, this.canvas.size / 3, this.canvas.size);
    this.reset();
  }

  update(delta: number): void {
    if (this.impulse !== 0) {
      this.positionTarget.y += this.impulse * this.speed;
      this.positionTarget.y = Math.min(2, Math.max(-2, this.positionTarget.y));
    }
    this.transform.position.y +=
      (this.positionTarget.y - this.transform.position.y) / (this.dampening * delta);
  }
}

@Injectable()
export class PongRacketPlayerControls extends Component {
  upKey = 'ArrowUp';
  downKey = 'ArrowDown';
  @sibling(PongRacket) racket!: PongRacket;
  private input!: InputManagerSystem;

  init() {
    this.input = this.requireSystem(InputManagerSystem);
  }

  update(): void {
    if (this.input.isKeyPressed(this.upKey)) {
      this.racket.impulse = 1;
    } else if (this.input.isKeyPressed(this.downKey)) {
      this.racket.impulse = -1;
    } else {
      this.racket.impulse = 0;
    }
  }
}

@Injectable()
export class PongRacketPrefab extends Prefab {
  protected build({
    position = { x: 0, y: 0, z: 0 },
  }: { position?: Vector3Like } = {}): EntityDescriptor {
    return {
      id: 'pong-racket',
      components: [
        { type: 'TransformComponent', position },
        { type: 'SpriteComponent' },
        { type: 'CanvasSpriteComponent' },
        { type: Collider.name, hitbox: { x: 0.25, y: 1, z: 0 } },
        { type: PongRacket.name },
      ],
    };
  }
}

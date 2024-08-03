import { Component, ComponentEventMap, sibling } from '@gg/component';
import { CanvasSpriteComponent } from '@gg/components/canvas-sprite.component';
import { TransformComponent } from '@gg/components/transform.component';
import { EntityDescriptor } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { Prefab } from '@gg/prefab';
import { Vector3, Vector3Like } from 'three/src/Three.js';
import { Collider } from './collision';

type PongBallEventMap = ComponentEventMap & {
  collision: { target: TransformComponent };
  'out-of-bounds': { side: 'left' | 'right' };
  reflect: object;
};

@Injectable()
export class PongBall extends Component<PongBallEventMap> {
  @sibling(CanvasSpriteComponent) canvas!: CanvasSpriteComponent;
  @sibling(TransformComponent) transform!: TransformComponent;
  @sibling(Collider) collider!: Collider;
  direction = new Vector3();
  speed = 0.005;
  currentSpeed = this.speed;
  private posUpdate = new Vector3();
  paused = false;
  bounds = new Vector3(10, 2, 0);

  reset(direction = Math.random() > 0.5 ? -1 : 1) {
    this.transform.position.set(0, 0, 0);
    this.direction.set(direction, -0.25 + Math.random() * 0.5, 0);
    this.currentSpeed = this.speed;
    this.paused = false;
  }

  init(): void {
    const { context, size } = this.canvas;
    // context.fillStyle = '#111111';
    // context.fillRect(0, 0, this.canvas.size, this.canvas.size);
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI, false);
    context.closePath();
    context.fill();

    this.reset();

    this.collider.on('collision', () => {
      this.direction.x *= -1;
      this.currentSpeed += 0.0001;
    });
  }

  update(delta: number) {
    if (this.paused) {
      return;
    }

    const { position } = this.transform;

    this.posUpdate.copy(this.direction).multiplyScalar(this.currentSpeed * delta);

    const targetX = position.x + this.posUpdate.x;

    if (targetX > this.bounds.x || targetX < this.bounds.x * -1) {
      this.emit({ type: 'out-of-bounds', side: targetX < 0 ? 'left' : 'right' });
      this.paused = true;
    }

    if (
      position.y + this.posUpdate.y > this.bounds.y ||
      position.y + this.posUpdate.y < this.bounds.y * -1
    ) {
      this.emit({ type: 'reflect' });
      this.direction.y *= -1;
      this.posUpdate.y *= -1;
    }

    position.add(this.posUpdate);
  }
}

@Injectable()
export class PongBallPrefab extends Prefab {
  protected build({
    position = { x: 0, y: 0, z: 0 },
  }: { position?: Vector3Like } = {}): EntityDescriptor {
    return {
      id: 'pong-ball',
      components: [
        { type: 'TransformComponent', position, scale: { x: 0.5, y: 0.5, z: 1 } },
        { type: 'SpriteComponent' },
        { type: 'CanvasSpriteComponent' },
        { type: Collider.name, hitbox: { x: 0.5, y: 0.5, z: 0 } },
        { type: PongBall.name },
      ],
    };
  }
}

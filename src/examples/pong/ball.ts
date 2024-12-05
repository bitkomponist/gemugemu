import { bindUi, Component, ComponentEventMap, sibling } from '@gg/component';
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
  @bindUi({ min: 0.001, max: 0.01 }) speed = 0.005;
  currentSpeed = this.speed;
  private posUpdate = new Vector3();
  @bindUi() paused = false;
  @bindUi() bounds = new Vector3(10, 2, 0);

  init(): void {
    this.draw();
    this.collider.on('collision', ({ target }) => this.onRacketHit(target));
    this.reset();
  }

  reset(direction = Math.random() > 0.5 ? -1 : 1) {
    this.transform.position.set(0, 0, 0);
    this.direction.set(direction, -0.25 + Math.random() * 0.5, 0);
    this.currentSpeed = this.speed;
    this.paused = false;
  }

  draw() {
    const { context, size } = this.canvas;
    // context.fillStyle = '#111111';
    // context.fillRect(0, 0, this.canvas.size, this.canvas.size);
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI, false);
    context.closePath();
    context.fill();
  }

  onRacketHit(target: Collider) {
    this.direction.x *= -1;
    const targetTransform = target.requireComponent(TransformComponent);
    const racketHalfHeight = 0;
    const steepness = Math.abs(
      targetTransform.position.y - this.transform.position.y - racketHalfHeight,
    );
    this.direction.y *= steepness * 25;
    this.direction.y = Math.min(2, Math.max(-2, this.direction.y));
    this.currentSpeed += 0.0001;
  }

  update(delta: number) {
    if (this.paused) {
      return;
    }
    const { position } = this.transform;
    this.posUpdate.copy(this.direction).multiplyScalar(this.currentSpeed * delta);

    const targetX = position.x + this.posUpdate.x;

    if (targetX > this.bounds.x || targetX < this.bounds.x * -1) {
      this.paused = true;
      this.emit({ type: 'out-of-bounds', side: targetX < 0 ? 'left' : 'right' });
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

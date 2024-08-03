import { Application } from '@gg/application';
import { Component, ComponentEventMap, sibling } from '@gg/component';
import { CanvasSpriteComponent } from '@gg/components/canvas-sprite.component';
import { TransformComponent } from '@gg/components/transform.component';
import { Entity, EntityDescriptor } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { Prefab } from '@gg/prefab';
import { System } from '@gg/system';
import { InputManagerSystem } from '@gg/systems/input-manager.system';
import { Vector3, Vector3Like } from 'three/src/Three.js';

@Injectable()
class CollisionManager extends System {
  colliders: Collider[] = [];

  initRoot(root: Entity) {
    this.colliders = root.getComponents(Collider, true);
    console.log('got %i colliders', this.colliders.length);
  }

  checkCollisions() {
    const { length } = this.colliders;

    for (let i = 0; i < length; ++i) {
      for (let j = i + 1; j < length; ++j) {
        if (this.isColliding(this.colliders[i], this.colliders[j])) {
          this.colliders[i].emit({ type: 'collision', target: this.colliders[j] });
          this.colliders[j].emit({ type: 'collision', target: this.colliders[i] });
        }
      }
    }
  }

  isColliding(a: Collider, b: Collider) {
    const box1 = a.getBounds();
    const box2 = b.getBounds();
    // Check if there is a gap between the boxes
    if (box1.right.x < box2.left.x || box1.left.x > box2.right.x) {
      return false;
    }
    if (box1.bottom.y < box2.top.y || box1.top.y > box2.bottom.y) {
      return false;
    }

    // If no gap, the boxes are intersecting
    return true;
  }

  updateRoot(): void {
    this.checkCollisions();
  }
}

type ColliderEventMap = ComponentEventMap & {
  collision: { target: Collider };
};

@Injectable()
class Collider extends Component<ColliderEventMap> {
  private _hitbox = new Vector3();
  private _bounds = {
    left: new Vector3(),
    right: new Vector3(),
    top: new Vector3(),
    bottom: new Vector3(),
  };

  @sibling(TransformComponent) transform!: TransformComponent;

  get hitbox(): Vector3 {
    return this._hitbox;
  }

  set hitbox(hitbox: Vector3Like) {
    this._hitbox.copy(hitbox);
  }

  getBounds() {
    const { position } = this.transform;
    this._bounds.left.copy(position).setComponent(0, position.x + this._hitbox.x * -0.5);
    this._bounds.right.copy(position).setComponent(0, position.x + this._hitbox.x * 0.5);
    this._bounds.top.copy(position).setComponent(1, position.y + this._hitbox.y * -0.5);
    this._bounds.bottom.copy(position).setComponent(1, position.y + this._hitbox.y * 0.5);
    return this._bounds;
  }
}

@Injectable()
class PongRacket extends Component {
  private positionTarget = new Vector3();
  speed = 0.1;
  dampening = 1;
  impulse = 0;
  @sibling(TransformComponent) transform!: TransformComponent;
  @sibling(CanvasSpriteComponent) canvas!: CanvasSpriteComponent;

  init(): void {
    this.positionTarget.copy(this.transform.position);
    const { context } = this.canvas;
    // context.fillStyle = '#111111';
    // context.fillRect(0, 0, this.canvas.size, this.canvas.size);
    context.fillStyle = '#ffffff';
    context.fillRect(this.canvas.size / 3, 0, this.canvas.size / 3, this.canvas.size);
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
class PongRacketPlayerControls extends Component {
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

type PongBallEventMap = ComponentEventMap & {
  collision: { target: TransformComponent };
  'out-of-bounds': object;
  reflect: object;
};

@Injectable()
class PongBall extends Component<PongBallEventMap> {
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

    if (
      position.x + this.posUpdate.x > this.bounds.x ||
      position.x + this.posUpdate.x < this.bounds.x * -1
    ) {
      this.emit({ type: 'out-of-bounds' });
      this.direction.x *= -1;
      this.posUpdate.x *= -1;
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
class PongRacketPrefab extends Prefab {
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

@Injectable()
class PongBallPrefab extends Prefab {
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

export const initPong = () =>
  Application.fromDescriptor({
    systems: [{ type: CollisionManager.name }],
    root: {
      entities: [
        {
          components: [
            { type: 'TransformComponent', position: { x: 0, y: 0, z: 1 } },
            { type: 'OrthographicCameraComponent', frustumSize: 7 },
          ],
        },
        {
          prefab: {
            type: PongRacketPrefab.name,
            position: { x: 5, y: 0, z: 0 },
            overrides: {
              id: 'player-a',
              components: [{ type: PongRacketPlayerControls.name }],
            },
          },
        },
        {
          prefab: {
            type: PongRacketPrefab.name,
            position: { x: -5, y: 0, z: 0 },
            overrides: {
              id: 'player-b',
              components: [{ type: PongRacketPlayerControls.name, upKey: 'w', downKey: 's' }],
            },
          },
        },
        { prefab: { type: PongBallPrefab.name } },
      ],
    },
  });

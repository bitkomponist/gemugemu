import { Component, ComponentEventMap, sibling } from '@gg/component';
import { TransformComponent } from '@gg/components/transform.component';
import { Entity } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { System } from '@gg/system';
import { Vector3, Vector3Like } from 'three/src/Three.js';

@Injectable()
export class CollisionManager extends System {
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
export class Collider extends Component<ColliderEventMap> {
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

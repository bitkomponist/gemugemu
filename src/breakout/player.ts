import { Component, InstantiableComponent } from '@gg/component';
import { Shape } from '@gg/components/shape.component';
import { Transform } from '@gg/components/transform.component';
import { createPrefab, Entity } from '@gg/entity';
import { isKeyPressed } from '@gg/keyboard';
import { Vector2 } from '@gg/math';
import { OriginGraphPrefab } from '@gg/prefabs/origin-graph.prefab';

export
@InstantiableComponent()
class BreakoutPlayerControls extends Component {
  #velocity: Vector2 = { x: 0, y: 0 };
  #transform?: Transform;
  #tPos: Vector2 = { x: 0, y: 0 };
  speed = 2;
  drag = 15;

  init() {
    this.#transform = this.entity.requireComponent(Transform);
    this.#tPos = { ...this.#transform.position };
  }

  update(delta: number): void {
    if (!this.#transform) {
      return;
    }

    if (isKeyPressed('ArrowLeft')) {
      this.#velocity.x = this.speed * delta * -1;
    } else if (isKeyPressed('ArrowRight')) {
      this.#velocity.x = this.speed * delta;
    } else {
      this.#velocity.x = 0;
    }

    this.#tPos.x += this.#velocity.x;
    this.#tPos.y += this.#velocity.y;

    this.#tPos.x = Math.max(Math.min(750, this.#tPos.x), 50);

    this.#transform.position.x += (this.#tPos.x - this.#transform.position.x) / this.drag;
    this.#transform.position.y += (this.#tPos.y - this.#transform.position.y) / this.drag;
  }
}

export const BreakoutPlayerPrefab = createPrefab(() => ({
  components: [
    Component.describe(Transform, { position: { x: 400, y: 550 } }),
    Component.describe(BreakoutPlayerControls)
  ],
  entities: [
    Entity.describe({
      id: 'player-shape',
      components: [
        Component.describe(Transform, { position: { x: -50, y: -15 } }),
        Component.describe(Shape, {
          fill: '#3333ff',
          path: 'l 100 0 l 100 30 l 0 30 l 0 0',
          cache: { x: 100, y: 30 },
        })
      ],
    }),
    OriginGraphPrefab(),
  ],
}));

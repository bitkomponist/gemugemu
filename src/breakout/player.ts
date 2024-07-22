import { Component, InstantiableComponent } from '../component';
import { createPrefab } from '../entity';
import { isKeyPressed } from '../keyboard';
import { Vector2 } from '../math';
import { Shape } from '../shape.component';
import { Transform } from '../transform.component';

export @InstantiableComponent() class BreakoutPlayerControls extends Component {
  #velocity: Vector2 = { x: 0, y: 0 }
  #transform?: Transform
  #tPos: Vector2 = { x: 0, y: 0 }
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
    {
      type: Transform.name,
      position: { x: 400, y: 550 }
    },
    {
      type: BreakoutPlayerControls.name
    }
  ],
  entities: [
    {
      id: 'player-shape',
      components: [
        { type: Transform.name, position: { x: -50, y: -15 } },
        { type: Shape.name, fill: '#3333ff', path: 'l 100 0 l 100 30 l 0 30 l 0 0' }
      ]
    },
    {
      id: 'pivot',
      components: [
        { type: Transform.name },
        { type: Shape.name, stroke: '#aaffff', lineWidth: 2, path: 'm -10 0 l 10 0 m 0 -10 l 0 10' }
      ]
    },
  ]
}));
import { Component, entityLookup, InstantiableComponent, sibling } from "~/gg/component";
import { Shape } from "~/gg/components/shape.component";
import { Transform } from "~/gg/components/transform.component";
import { createPrefab, Entity } from "~/gg/entity";
import { vec2 } from "~/gg/math";

export @InstantiableComponent() class BreakoutBallControl extends Component {
  velocity = vec2(1, 1)

  speed = .1

  @sibling(Transform) transform!: Transform;

  @entityLookup('../breakout-player') player!: Entity;

  init() {
    const pT = this.player.requireComponent(Transform);
    this.transform.position.x = pT.position.x;
    this.transform.position.y = pT.position.y - 50;
  }

  update(delta: number) {
    const { velocity, transform: { position } } = this;

    if (position.x + velocity.x < 0 || position.x + velocity.x > 1024) {
      velocity.x *= -1;
    }

    if (position.y + velocity.y < 0 || position.y + velocity.y > 768) {
      velocity.y *= -1;
    }

    this.transform.position.add(this.velocity.clone().multiplyScalar(delta * this.speed));
  }
}

export const BreakoutBallPrefab = createPrefab(() => (
  {
    components: [
      Component.describe(Transform),
      Component.describe(BreakoutBallControl)
    ],
    entities: [
      Entity.describe({
        components: [
          Component.describe(Transform, { position: vec2(-5, -5) }),
          Component.describe(Shape, { fill: '#ff0000', path: 'l 0 10 l 10 10 l 10 0 l 0 0' })
        ]
      })
    ]
  }
))
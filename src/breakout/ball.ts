import { Component, entityLookup, RegisteredComponent, sibling } from "@gg/component";
import { Shape } from "@gg/components/shape.component";
import { Transform2d } from "@gg/components/transform-2d.component";
import { Entity } from "@gg/entity";
import { vec2 } from "@gg/math";
import { Prefab, RegisteredPrefab } from "@gg/prefab";
import { Renderer2d } from "@gg/systems/renderer-2d.system";

export @RegisteredComponent() class BreakoutBallControl extends Component {
  velocity = vec2(1, 1)

  speed = .1

  @sibling(Transform2d) transform!: Transform2d;

  @entityLookup('../breakout-player') player!: Entity;

  init() {
    const pT = this.player.requireComponent(Transform2d);
    this.transform.position.x = pT.position.x;
    this.transform.position.y = pT.position.y - 50;
  }

  update(delta: number) {
    const { viewport } = this.requireSystem(Renderer2d);

    const { velocity, transform: { position } } = this;

    if (position.x + velocity.x < 0 || position.x + velocity.x > viewport.x) {
      velocity.x *= -1;
    }

    if (position.y + velocity.y < 0 || position.y + velocity.y > viewport.y) {
      velocity.y *= -1;
    }

    this.transform.position.add(this.velocity.clone().multiplyScalar(delta * this.speed));
  }
}

export @RegisteredPrefab() class BreakoutBall extends Prefab {
  protected build() {
    return {
      components: [
        Component.describe(Transform2d),
        Component.describe(BreakoutBallControl)
      ],
      entities: [
        Entity.describe({
          components: [
            Component.describe(Transform2d, { position: vec2(-5, -5) }),
            Component.describe(Shape, { fill: '#ff0000', path: 'l 0 10 l 10 10 l 10 0 l 0 0' })
          ]
        })
      ]
    }
  }
}
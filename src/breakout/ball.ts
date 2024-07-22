import { Component, entityLookup, InstantiableComponent, sibling } from "~/gg/component";
import { Shape } from "~/gg/components/shape.component";
import { Transform } from "~/gg/components/transform.component";
import { createPrefab, Entity } from "~/gg/entity";
import { vec2 } from "~/gg/math";

export @InstantiableComponent() class BreakoutBallControl extends Component {
  velocity = vec2()
  @sibling(Transform) transform!: Transform;
  @entityLookup('../breakout-player') player!: Entity;
  init() {

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
          Component.describe(Transform),
          Component.describe(Shape, { fill: '#ff000', path: 'l 0 10 l 10 10 l 10 0 l 0 0' })
        ]
      })
    ]
  }
))
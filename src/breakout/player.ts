import { Component, RegisteredComponent, sibling } from '@gg/component';
import { Shape } from '@gg/components/shape.component';
import { Transform2d } from '@gg/components/transform-2d.component';
import { Entity } from '@gg/entity';
import { isKeyPressed } from '@gg/keyboard';
import { clamp, vec2 } from '@gg/math';
import { Prefab, RegisteredPrefab } from '@gg/prefab';
import { OriginGraph } from '@gg/prefabs/origin-graph.prefab';
import { Renderer2d } from '@gg/systems/renderer-2d.system';

export @RegisteredComponent() class BreakoutPlayerControls extends Component {
  @sibling(Transform2d) private transform!: Transform2d;
  private targetPosition = vec2();
  private velocity = vec2();
  speed = 2;
  drag = 15;

  init() {
    const { viewport } = this.requireSystem(Renderer2d);
    this.transform.position.set(
      viewport.x / 2,
      viewport.y - 50
    );
    this.targetPosition.setVector(this.transform.position);
  }

  update(delta: number): void {
    if (!this.transform) {
      return;
    }

    if (isKeyPressed('ArrowLeft')) {
      this.velocity.x = this.speed * delta * -1;
    } else if (isKeyPressed('ArrowRight')) {
      this.velocity.x = this.speed * delta;
    } else {
      this.velocity.x = 0;
    }

    const { viewport } = this.requireSystem(Renderer2d);

    this.targetPosition.add(this.velocity);

    this.targetPosition.x = clamp(50, viewport.x - 50, this.targetPosition.x);

    this.transform.position.x += (this.targetPosition.x - this.transform.position.x) / this.drag;
    this.transform.position.y += (this.targetPosition.y - this.transform.position.y) / this.drag;
  }
}

export @RegisteredPrefab() class BreakoutPlayer extends Prefab {
  protected build() {
    return {
      id: 'breakout-player',
      components: [
        Component.describe(Transform2d),
        Component.describe(BreakoutPlayerControls)
      ],
      entities: [
        Entity.describe({
          id: 'player-shape',
          components: [
            Component.describe(Transform2d, { position: vec2(-50, -15) }),
            Component.describe(Shape, {
              fill: '#3333ff',
              path: 'l 100 0 l 100 30 l 0 30 l 0 0',
              cache: vec2(100, 30),
            })
          ],
        }),
        Entity.describe({ prefab: OriginGraph.name })
      ],
    }
  }
}

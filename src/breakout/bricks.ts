import { Component, InstantiableComponent } from '@gg/component';
import { Shape } from '@gg/components/shape.component';
import { Transform } from '@gg/components/transform.component';
import { createPrefab, Entity } from '@gg/entity';
import { vec2, Vector2 } from '@gg/math';
import { OriginGraphPrefab } from '@gg/prefabs/origin-graph.prefab';

const BrickPrefab = createPrefab(
  ({ size = vec2(100, 20), color = '#aaaaee' }: { size?: Vector2; color?: string } = {}) => ({
    components: [
      Component.describe(Transform)
    ],
    entities: [
      Entity.describe({
        id: 'shape',
        components: [
          Component.describe(Transform, { position: size.multiplyScalar(-.5) }),
          Component.describe(Shape, {
            fill: color,
            path: `l ${size.x} 0 l ${size.x} ${size.y} l 0 ${size.y} l 0 0`,
            cache: size.clone()
          })
        ]
      }),
      OriginGraphPrefab(),
    ],
  }),
);

export
@InstantiableComponent()
class BreakoutBricksGrid extends Component {
  rows = 5;
  cols = 5;
  gap = 10;
  offsetY = 40;
  brickSize = vec2(100, 20);

  init(): void {
    const width = (this.cols - 1) * this.gap + this.cols * this.brickSize.x;
    // const height = this.rows - 1 * this.gap + this.rows * 20;
    const offsetX = (Number(this.application?.canvas?.width) - width) / 2 + this.brickSize.x / 2;
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const brick = Entity.fromDescriptor(BrickPrefab());
        const brickTransform = brick.requireComponent(Transform);
        brickTransform.position.x = offsetX + x * (this.brickSize.x + this.gap);
        brickTransform.position.y = this.offsetY + y * (this.brickSize.y + this.gap);
        this.entity.entities.push(brick);
      }
    }
  }
}

export const BreakoutBricksPrefab = createPrefab(
  ({ rows = 8, cols = 7 }: { rows?: number; cols?: number } = {}) => ({
    components: [{ type: Transform.name }, { type: BreakoutBricksGrid.name, rows, cols }],
  }),
);

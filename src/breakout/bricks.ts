import { Component, InstantiableComponent } from '../component';
import { createPrefab, Entity } from '../entity';
import { Shape } from '../shape.component';
import { Transform } from '../transform.component';

const BrickPrefab = createPrefab(() => ({
  components: [
    {
      type: Transform.name,
    },
    { type: Shape.name, fill: '#aaaaee', path: 'l 100 0 l 100 20 l 0 20 l 0 0' }
  ]
}))

export @InstantiableComponent() class BreakoutBricksGrid extends Component {
  rows = 5
  cols = 5
  gap = 10
  offsetY = 40

  init(): void {
    const width = (this.cols - 1) * this.gap + this.cols * 100;
    // const height = this.rows - 1 * this.gap + this.rows * 20;
    const offsetX = (800 - width) / 2;
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const brick = Entity.fromDescriptor(BrickPrefab());
        const brickTransform = brick.requireComponent(Transform);
        brickTransform.position.x = offsetX + x * (100 + this.gap);
        brickTransform.position.y = this.offsetY + y * (20 + this.gap);
        this.entity.entities.push(brick);
      }
    }
  }
}

export const BreakoutBricksPrefab = createPrefab(({ rows = 4, cols = 6 }: { rows?: number, cols?: number } = {}) => ({
  components: [
    { type: Transform.name },
    { type: BreakoutBricksGrid.name, rows, cols }
  ]
}));
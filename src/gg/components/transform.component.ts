import { Component, InstantiableComponent } from '../component';
import { Entity } from '../entity';
import { Vector2 } from '../math';

export
@InstantiableComponent()
class Transform extends Component {
  position: Vector2 = { x: 0, y: 0 };
  scale: Vector2 = { x: 1, y: 1 };
  rotation = 0;

  getParentTransform() {
    if (this.entity.parent instanceof Entity) {
      return this.entity.parent.getComponent(Transform);
    }
  }

  getGlobalTransform() {
    let globalPosition = { ...this.position };
    let globalScale = { ...this.scale };
    let globalRotation = this.rotation;

    let current: Transform | undefined = this.getParentTransform();

    while (current) {
      // Calculate global position
      const rad = current.rotation * (Math.PI / 180);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Apply parent's rotation to this position
      globalPosition = {
        x: current.position.x + (cos * globalPosition.x - sin * globalPosition.y) * current.scale.x,
        y: current.position.y + (sin * globalPosition.x + cos * globalPosition.y) * current.scale.y,
      };

      // Apply parent's scale to this scale
      globalScale = {
        x: globalScale.x * current.scale.x,
        y: globalScale.y * current.scale.y,
      };

      // Add parent's rotation to this rotation
      globalRotation += current.rotation;

      current = current.getParentTransform();
    }

    return { position: globalPosition, scale: globalScale, rotation: globalRotation };
  }
}

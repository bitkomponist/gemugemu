import { Component, RegisteredComponent } from '../component';
import { Entity } from '../entity';
import { vec2 } from '../math';

export
@RegisteredComponent()
class Transform2d extends Component {
  position = vec2();
  scale = vec2(1, 1);
  rotation = 0;

  getParentTransform() {
    if (this.entity.parent instanceof Entity) {
      return this.entity.parent.getComponent(Transform2d);
    }
  }

  getGlobalTransform() {
    let globalPosition = this.position.clone();
    let globalScale = this.scale.clone();
    let globalRotation = this.rotation;

    let current: Transform2d | undefined = this.getParentTransform();

    while (current) {
      // Calculate global position
      const rad = current.rotation * (Math.PI / 180);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Apply parent's rotation to this position
      globalPosition = vec2(
        current.position.x + (cos * globalPosition.x - sin * globalPosition.y) * current.scale.x,
        current.position.y + (sin * globalPosition.x + cos * globalPosition.y) * current.scale.y,
      );

      // Apply parent's scale to this scale
      globalScale = vec2(
        globalScale.x * current.scale.x,
        globalScale.y * current.scale.y,
      );

      // Add parent's rotation to this rotation
      globalRotation += current.rotation;

      current = current.getParentTransform();
    }

    return { position: globalPosition, scale: globalScale, rotation: globalRotation };
  }
}

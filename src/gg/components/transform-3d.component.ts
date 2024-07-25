import { Entity } from '@gg/entity';
import { Euler, Object3D, Quaternion, Vector3Like } from 'three/src/Three.js';
import { Component, RegisteredComponent } from '../component';

export
@RegisteredComponent()
class Transform3d extends Component {
  public object3d = new Object3D();

  get position() {
    return this.object3d.position;
  }

  set position(position: Vector3Like) {
    this.object3d.position.copy(position);
  }

  get scale() {
    return this.object3d.scale;
  }

  set scale(scale: Vector3Like) {
    this.object3d.scale.copy(scale);
  }

  get rotation() {
    return this.object3d.rotation;
  }

  set rotation(rotation: Euler) {
    this.object3d.rotation.copy(rotation);
  }

  get quaternion() {
    return this.object3d.quaternion;
  }

  set quaternion(quaternion: Quaternion) {
    this.object3d.quaternion.copy(quaternion);
  }

  onAddedToHierarchy(): void {
    this.object3d.userData.transform = this;

    if (!this.entity.parent || !(this.entity.parent instanceof Entity)) return;

    const parentTransform = this.entity.parent.getComponent(Transform3d);

    if (parentTransform?.object3d) {
      parentTransform.object3d.add(this.object3d);
    }

    super.onAddedToHierarchy();
  }

  onRemovedFromHierarchy(): void {
    if (this.object3d.parent) {
      this.object3d.parent.remove(this.object3d);
    }
    super.onRemovedFromHierarchy();
  }

  /** @todo remove from parent when component or entity removed */
}

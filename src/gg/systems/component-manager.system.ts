import { Component } from '@gg/component';
import { Injectable } from '@gg/injection';
import { Entity } from '../entity';
import { System } from '../system';

export interface LifecycleComponent {
  update?(delta: number): void;
}

declare module '@gg/component' {
  interface Component extends LifecycleComponent {}
}

export
@Injectable()
class ComponentManagerSystem extends System {
  private dirty = true;
  private updateables: Component[] = [];

  updateRoot(root: Entity, delta: number): void {
    this.dirty = true;
    this.updateComponentLists(root);
    for (const component of this.updateables) {
      component.update?.(delta);
    }
  }

  updateComponentLists(root: Entity) {
    if (!this.dirty) {
      return;
    }

    this.updateables.splice(0, this.updateables.length);

    for (const entity of root.getGrandChildren()) {
      if (!('components' in entity)) {
        continue;
      }

      for (const component of entity.components) {
        if (component.update) {
          this.updateables.push(component);
        }
      }
    }

    this.dirty = false;
  }
}

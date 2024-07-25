import { Component } from "@gg/component";
import { EntityContainer } from "../entity-container";
import { RegisteredSystem, System } from "../system";

export interface LifecycleComponent {
  update?(delta: number): void;
}

declare module '@gg/component' {
  interface Component extends LifecycleComponent { }
}

export @RegisteredSystem() class ComponentManager extends System {
  private dirty = true;
  private updateables: Component[] = [];

  updateRoot(root: EntityContainer, delta: number): void {
    this.dirty = true;
    this.updateComponentLists(root);
    for (const component of this.updateables) {
      component.update?.(delta);
    }
  }

  updateComponentLists(root: EntityContainer) {
    if (!this.dirty) {
      return;
    }

    this.updateables.splice(0, this.updateables.length);

    for (const entity of root.getGrandChildren()) {
      for (const component of entity.components) {
        if (component.update) {
          this.updateables.push(component);
        }
      }
    }

    this.dirty = false;
  }

}
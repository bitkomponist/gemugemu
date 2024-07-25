import { Component } from "@gg/component";
import { Canvas } from "../canvas";
import { Transform2d } from "../components/transform-2d.component";
import { EntityContainer } from "../entity-container";
import { vec2 } from "../math";
import { RegisteredSystem, System } from "../system";

export interface Renderable2d {
  render2d?(renderer: Renderer2d): void;
}

declare module '@gg/component' {
  interface Component extends Renderable2d { }
}

export @RegisteredSystem() class Renderer2d extends System {
  private dirty = true;
  private renderables: Component[] = [];
  canvas = new Canvas({ selector: '#app', width: 800, height: 600 });

  get viewport() {
    return vec2(this.canvas.width, this.canvas.height);
  }

  updateRoot(root: EntityContainer): void {
    this.dirty = true;
    this.updateComponentLists(root);
    this.render();
  }

  updateComponentLists(root: EntityContainer) {
    if (!this.dirty) {
      return;
    }

    this.renderables.splice(0, this.renderables.length);

    for (const entity of root.getGrandChildren()) {
      for (const component of entity.components) {
        if (component.render2d) {
          this.renderables.push(component);
        }
      }
    }

    this.dirty = false;
  }

  render() {
    const { canvas } = this;
    canvas.clear();
    for (const component of this.renderables) {
      canvas.context.save();
      let currentTransform = component.entity.getComponent(Transform2d);
      const ts: Transform2d[] = [];
      while (currentTransform) {
        ts.push(currentTransform);
        currentTransform = currentTransform.getParentTransform();
      }
      ts.reverse().forEach((t) => canvas.applyTransform(t));
      component.render2d?.(this);
      canvas.context.restore();
    }
  }
}
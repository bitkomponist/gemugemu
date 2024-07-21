import { Canvas } from "./canvas";
import { Component } from "./component";
import { EntityContainer } from "./entity";
import { Transform } from "./transform.component";

export abstract class Application {
  canvas = new Canvas();

  constructor(public root?: EntityContainer) { }
  private currentAnimationFrame?: number;
  private lastTime = 0;

  start() {
    this.currentAnimationFrame = requestAnimationFrame(this.tick);
    return this;
  }

  stop() {
    if (!this.currentAnimationFrame) {
      return this;
    }
    cancelAnimationFrame(this.currentAnimationFrame);
    return this;
  }

  private tick: FrameRequestCallback = (time) => {
    this.update(time - this.lastTime);
    this.render();
    this.lastTime = time;
    this.currentAnimationFrame = requestAnimationFrame(this.tick)
  }

  private dirty = true;
  private renderables: Component[] = [];
  private updateables: Component[] = [];

  updateComponentLists() {
    if (!this.dirty) {
      return;
    }

    this.updateables = [];
    this.renderables = [];

    // todo solve nested
    for (const entity of this.root?.entities ?? []) {
      for (const component of entity.components) {
        if (component.update) {
          this.updateables.push(component);
        }
        if (component.render) {
          this.renderables.push(component);
        }
      }
    }

    this.dirty = false;
  }

  update(delta: number) {
    this.dirty = true;
    this.updateComponentLists();

    for (const component of this.updateables) {
      component.update?.(delta);
    }
  }

  render() {
    const { canvas } = this;
    canvas.clear();
    for (const component of this.renderables) {
      canvas.context.save();
      //todo solve nested transforms
      canvas.applyTransform(component.entity.requireComponent(Transform));
      component.render?.(canvas);
      canvas.context.restore();
    }
  }
}
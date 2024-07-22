import { Canvas } from './canvas';
import { Component } from './component';
import { Entity, EntityContainer, EntityDescriptor } from './entity';
import { Transform } from './transform.component';

export type ApplicationDescriptor = {
  root?: { entities: EntityDescriptor[] };
};
export class Application {
  static fromDescriptor({ root: rootDescriptor }: ApplicationDescriptor) {
    const root = new EntityContainer();
    root.entities = rootDescriptor?.entities.map((d) => Entity.fromDescriptor(d)) ?? [];
    return new Application(root);
  }

  canvas = new Canvas({ selector: '#app' });

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
    this.currentAnimationFrame = requestAnimationFrame(this.tick);
  };

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
    for (const entity of this.root?.getGrandChildren() ?? []) {
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
      let currentTransform = component.entity.getComponent(Transform);
      const ts: Transform[] = [];
      while (currentTransform) {
        ts.push(currentTransform);
        currentTransform = currentTransform.getParentTransform();
      }
      ts.reverse().forEach((t) => canvas.applyTransform(t));
      component.render?.(canvas);
      canvas.context.restore();
    }
  }
}

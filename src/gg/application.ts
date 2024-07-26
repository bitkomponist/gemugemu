import '@gg/registry';
import { Entity, EntityDescriptor } from './entity';
import { EntityContainer } from './entity-container';
import { System, SystemDescriptor } from './system';
import { ComponentManager } from './systems/component-manager.system';
import { Renderer } from './systems/renderer.system';
import { ResourceManager } from './systems/resource-manager.system';

export type ApplicationDescriptor = {
  systems?: SystemDescriptor[];
  root?: { entities: EntityDescriptor[] };
};
export class Application {
  static DEFAULT_SYSTEMS: SystemDescriptor[] = [
    { type: ComponentManager.name },
    { type: ResourceManager.name },
    { type: Renderer.name },
  ]

  static fromDescriptor({ systems = [], root: rootDescriptor }: ApplicationDescriptor) {
    const root = new EntityContainer();
    if (rootDescriptor) {
      root.entities.add(...rootDescriptor.entities.map((d) => Entity.fromDescriptor(d)));
    }
    return new Application(root, [...Application.DEFAULT_SYSTEMS, ...systems].map(d => System.fromDescriptor(d)));
  }

  #root?: EntityContainer;

  constructor(root?: EntityContainer, public systems?: System[], autostart = true) {
    this.systems?.forEach(system => {
      system.application = this;
    });

    this.root = root;

    if (root && autostart) {
      this.start();
    }
  }

  set root(root: EntityContainer | undefined) {
    this.#root = root;
    if (root) {
      root.application = this;
      this.systems?.forEach(sys => {
        sys.initRoot?.(root);
      })
    }
  }

  get root() {
    return this.#root;
  }

  private currentAnimationFrame?: number;
  private lastTime = 0;

  start() {
    this.currentAnimationFrame = requestAnimationFrame(this.tick);
    return this;
  }

  stop() {
    if (this.root) {
      const { root } = this;
      this.systems?.forEach(sys => {
        sys.destructRoot?.(root);
      })
    }
    if (!this.currentAnimationFrame) {
      return this;
    }
    cancelAnimationFrame(this.currentAnimationFrame);
    return this;
  }

  private tick: FrameRequestCallback = (time) => {
    const delta = time - this.lastTime;

    if (this.root) {
      const { root } = this;
      this.systems?.forEach(sys => {
        sys.updateRoot?.(root, delta);
      })
    }

    this.lastTime = time;
    this.currentAnimationFrame = requestAnimationFrame(this.tick);
  };

}

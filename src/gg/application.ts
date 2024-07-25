import '@gg/registry';
import { Entity, EntityDescriptor } from './entity';
import { EntityContainer } from './entity-container';
import { System, SystemDescriptor } from './system';
import { ComponentManager } from './systems/component-manager.system';

export type ApplicationDescriptor = {
  systems?: SystemDescriptor[];
  root?: { entities: EntityDescriptor[] };
};
export class Application {
  static DEFAULT_SYSTEMS: SystemDescriptor[] = [
    { type: ComponentManager.name },
  ]

  static fromDescriptor({ systems = Application.DEFAULT_SYSTEMS, root: rootDescriptor }: ApplicationDescriptor) {
    const root = new EntityContainer();
    root.entities = rootDescriptor?.entities.map((d) => Entity.fromDescriptor(d)) ?? [];
    return new Application(root, systems.map(d => System.fromDescriptor(d)));
  }

  #root?: EntityContainer;

  constructor(root?: EntityContainer, public systems?: System[]) {
    this.systems?.forEach(system => {
      system.application = this;
    });

    this.root = root;
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

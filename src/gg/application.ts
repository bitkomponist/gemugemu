import '@gg/registry';
import { Entity, EntityDescriptor } from './entity';
import { EntityContainer } from './entity-container';
import { System, SystemDescriptor } from './system';
import { ComponentManager } from './systems/component-manager.system';
import { Renderer } from './systems/renderer.system';
import { ResourceManager } from './systems/resource-manager.system';

/**
 * interface with properties necessary to instantiate a application object
 */
export type ApplicationDescriptor = {
  systems?: SystemDescriptor[];
  root?: { entities: EntityDescriptor[] };
};
export class Application {
  /**
   * Default systems, which should be present in every application
   */
  static DEFAULT_SYSTEMS: SystemDescriptor[] = [
    { type: ComponentManager.name },
    { type: ResourceManager.name },
    { type: Renderer.name },
  ];

  /**
   * Create Application from a ApplicationDescriptor object
   * @param descriptor - ApplicationDescriptor object
   * @returns Application
   */
  static fromDescriptor({ systems = [], root: rootDescriptor }: ApplicationDescriptor) {
    const root = new EntityContainer();
    if (rootDescriptor) {
      root.entities.add(...rootDescriptor.entities.map((d) => Entity.fromDescriptor(d)));
    }
    return new Application(
      root,
      [...Application.DEFAULT_SYSTEMS, ...systems].map((d) => System.fromDescriptor(d)),
    );
  }

  /** internal reference to the current root container */
  private _root?: EntityContainer;

  /** sets the current root container and initializes the app's systems with it */
  set root(root: EntityContainer | undefined) {
    this._root = root;
    if (root) {
      root.application = this;
      this.systems?.forEach((sys) => {
        sys.initRoot?.(root);
      });
    }
  }

  /** get the current root container */
  get root() {
    return this._root;
  }

  /**
   * Creates a new instance of Application
   * @param root - container with elements to construct the scene
   * @param systems - to be used by the application (default systems are also added)
   * @param autostart - if a root container was provided, start the application immediately
   */
  constructor(
    root?: EntityContainer,
    public systems?: System[],
    autostart = true,
  ) {
    this.systems?.forEach((system) => {
      system.application = this;
    });

    this.root = root;

    if (root && autostart) {
      this.start();
    }
  }

  /** reference to the animation frame callback that runs next */
  private currentAnimationFrame?: number;

  /** timestamp of the last executed animation frame */
  private lastTime = 0;

  /**
   * starts the application update loop
   * @returns this application
   */
  start() {
    this.currentAnimationFrame = requestAnimationFrame(this.onAnimationFrame);
    return this;
  }

  /**
   * destroys the current root and stops the update loop
   * @returns this application
   */
  stop() {
    if (this.root) {
      const { root } = this;
      this.systems?.forEach((sys) => {
        sys.destructRoot?.(root);
      });
    }
    if (!this.currentAnimationFrame) {
      return this;
    }
    cancelAnimationFrame(this.currentAnimationFrame);
    return this;
  }

  /**
   * update function that runs each animation frame
   * @param time - DOMHighResTimeStamp
   */
  private onAnimationFrame: FrameRequestCallback = (time) => {
    const delta = time - this.lastTime;

    if (this.root) {
      const { root } = this;
      this.systems?.forEach((sys) => {
        sys.updateRoot?.(root, delta);
      });
    }

    this.lastTime = time;
    this.currentAnimationFrame = requestAnimationFrame(this.onAnimationFrame);
  };
}

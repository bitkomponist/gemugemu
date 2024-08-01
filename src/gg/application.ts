import '@gg/registry';
import { Entity, EntityDescriptor } from './entity';
import { System, SystemDescriptor } from './system';
import { ComponentManagerSystem } from './systems/component-manager.system';
import { InputManagerSystem } from './systems/input-manager.system';
import { RendererSystem } from './systems/renderer.system';
import { ResourceManagerSystem } from './systems/resource-manager.system';

/** Interface with properties necessary to instantiate a application object */
export type ApplicationDescriptor = {
  systems?: SystemDescriptor[];
  root?: { entities: EntityDescriptor[] };
};

/**
 * All encompassing application object, acts as global state for your game and controls the update
 * loop
 *
 * @example
 *
 * ```
 * const myApp = Application.fromDescriptor({
 *   systems: [{ type: 'MyCustomSystem' }],
 *   entities: [
 *     {
 *       id: 'myEntity',
 *       components: [{ type: 'GreeterComponent', message: 'Hello World' }],
 *     },
 *   ],
 * });
 * ```
 */
export class Application {
  /** Default systems, which should be present in every application */
  static DEFAULT_SYSTEMS: SystemDescriptor[] = [
    { type: ComponentManagerSystem.name },
    { type: ResourceManagerSystem.name },
    { type: RendererSystem.name },
    { type: InputManagerSystem.name },
  ];

  /**
   * Create Application from a ApplicationDescriptor object
   *
   * @param descriptor - ApplicationDescriptor object
   * @returns Application
   */
  static fromDescriptor({ systems = [], root: rootDescriptor }: ApplicationDescriptor) {
    const root = new Entity('$root');
    if (rootDescriptor) {
      root.entities.add(...rootDescriptor.entities.map((d) => Entity.fromDescriptor(d)));
    }
    return new Application(
      root,
      [...Application.DEFAULT_SYSTEMS, ...systems].map((d) => System.fromDescriptor(d)),
    );
  }

  /** Internal reference to the current root container */
  private _root?: Entity;

  /** Sets the current root container and initializes the app's systems with it */
  set root(root: Entity | undefined) {
    this._root = root;
    if (root) {
      root.application = this;
      this.systems?.forEach((sys) => {
        sys.initRoot?.(root);
      });
    }
  }

  /** Get the current root container */
  get root() {
    return this._root;
  }

  /**
   * Creates a new instance of Application
   *
   * @param root - Container with elements to construct the scene
   * @param systems - To be used by the application (default systems are also added)
   * @param autostart - If a root container was provided, start the application immediately
   */
  constructor(
    root?: Entity,
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

  /** Reference to the animation frame callback that runs next */
  private currentAnimationFrame?: number;

  /** Timestamp of the last executed animation frame */
  private lastTime = 0;

  /**
   * Starts the application update loop
   *
   * @returns This application
   */
  start() {
    this.currentAnimationFrame = requestAnimationFrame(this.onAnimationFrame);
    return this;
  }

  /**
   * Destroys the current root and stops the update loop
   *
   * @returns This application
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
   * Update function that runs each animation frame
   *
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

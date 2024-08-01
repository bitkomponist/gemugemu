import { Application } from './application';
import { Entity } from './entity';
import { getInjectableType } from './injection';

/** Base class for systems that are instantiated once per application */
export class System {
  /**
   * Optional callback to run when a application is first started
   *
   * @param root - Entitycontainer that resembles the hierarchy root of this application
   */
  initRoot?(root: Entity): void;
  /**
   * Optional callback to run when an application's update loop is invoked
   *
   * @param root - Entitycontainer that resembles the hierarchy root of this application
   * @param delta - Time between this and the last update loops execution
   */
  updateRoot?(root: Entity, delta: number): void;
  /**
   * Optional callback to run when a applications root entitycontainer is removed
   *
   * @param root - Entitycontainer that resembles the hierarchy root of this application
   */
  destructRoot?(root: Entity): void;

  /** Internal reference to the parent application */
  private _application?: Application;

  /** Gets the parent application, throws when accessed before initialization */
  get application() {
    if (!this._application) {
      throw new Error('tried to access application before proper initialization');
    }

    return this._application;
  }

  /** Sets the parent application */
  set application(application: Application) {
    this._application = application;
  }

  /**
   * Creates a system instance based on a given configuration object (descriptor)
   *
   * @param descriptor - Configuration to set on the newly created system instance
   * @returns The system
   */
  static fromDescriptor(descriptor: SystemDescriptor) {
    const { type, ...props } = descriptor;
    const SystemType = getInjectableType<System>(type);
    if (!SystemType) {
      throw new Error(`unknown system type ${type}`);
    }

    return new SystemType(props);
  }
}

export type SystemDescriptor<T extends System = System> = { type: string } & Partial<T>;

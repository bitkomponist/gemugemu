import { Application } from './application';
import { EntityContainer } from './entity-container';
import { getInjectableType } from './injection';

export class System {
  initRoot?(root: EntityContainer): void;
  updateRoot?(root: EntityContainer, delta: number): void;
  destructRoot?(root: EntityContainer): void;

  private _application?: Application;

  get application() {
    if (!this._application) {
      throw new Error('tried to access application before proper initialization');
    }

    return this._application;
  }

  set application(application: Application) {
    this._application = application;
  }

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

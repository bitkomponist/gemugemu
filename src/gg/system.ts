import { Application } from './application';
import { EntityContainer } from './entity-container';

export interface System {
  initRoot?(root: EntityContainer): void;
  updateRoot?(root: EntityContainer, delta: number): void;
  destructRoot?(root: EntityContainer): void;
}

export class System {
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
    const SystemType = systemNameRegistry.get(type);
    if (!SystemType) {
      throw new Error(`unknown system type ${type}`);
    }

    return new SystemType(props);
  }
}

export type SystemDescriptor<T extends System = any> = { type: string } & Partial<T>;

export type SystemType<T extends System = System> = new (...args: any[]) => T;

const systemNameRegistry = new Map<string, SystemType>();

const systemRegistry = new Map<SystemType, string>();

export function RegisteredSystem(): (target: SystemType) => void {
  return (target) => {
    if (systemNameRegistry.has(target.name)) {
      throw new Error(`System type ${target.name} is already registered`);
    }
    systemNameRegistry.set(target.name, target);
    systemRegistry.set(target, target.name);
  };
}

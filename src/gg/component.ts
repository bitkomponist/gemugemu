import { Entity } from './entity';
import { getInjectableType, InjectableType } from './injection';
import { System } from './system';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentDescriptor<T extends Component = any> = { type: string } & Partial<T>;

function getComponentInstance<T extends Component>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctor: new (...args: any[]) => T,
  props: Partial<T>,
) {
  const component = new ctor();
  return component.set(props);
}

function getComponentInstanceById<T extends Component>(name: string, props: Partial<T>) {
  const ctor = getInjectableType<T>(name);
  if (!ctor) throw new Error(`unknown component type ${name}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getComponentInstance<T>(ctor as new (...args: any[]) => T, props);
}

const siblingMap = new Map<object, Map<string | symbol, InjectableType<Component>>>();

export function sibling(type: InjectableType<Component>): PropertyDecorator {
  return (object, key) => {
    const target = object.constructor;
    if (!siblingMap.has(target)) {
      siblingMap.set(target, new Map());
    }
    siblingMap.get(target)?.set(key, type);
  };
}

const entityLookupMap = new Map<object, Map<string | symbol, string>>();

export function entityLookup(path: string): PropertyDecorator {
  return (object, key) => {
    const target = object.constructor;
    if (!entityLookupMap.has(target)) {
      entityLookupMap.set(target, new Map());
    }
    entityLookupMap.get(target)?.set(key, path);
  };
}

export abstract class Component {
  init?(): void;
  destroy?(): void;

  static fromDescriptor<T extends Component>({ type: id, ...props }: ComponentDescriptor) {
    return getComponentInstanceById<T>(id, props as Partial<T>);
  }

  static describe<T extends Component = Component>(
    type: InjectableType<T>,
    descriptor?: Omit<ComponentDescriptor<T>, 'type'>,
  ) {
    return {
      ...(descriptor ?? {}),
      type: type.name,
    } as ComponentDescriptor<T>;
  }

  #entity?: Entity;

  constructor(props?: Parameters<typeof this.set>[0]) {
    props && this.set(props);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    return this.entity.getComponent(ctor);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    return this.entity.requireComponent(ctor);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSystem<T extends System>(ctor: new (...args: any[]) => T) {
    return this.entity.getSystem(ctor);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireSystem<T extends System>(ctor: new (...args: any[]) => T) {
    return this.entity.requireSystem(ctor);
  }

  private initialized: boolean = false;

  onAddedToHierarchy() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.resolveSiblings();
    this.resolveEntityLookups();
    this.init?.();
  }

  onRemovedFromHierarchy() {
    this.initialized = false;
    this.destroy?.();
  }

  private resolveSiblings() {
    const selfType = this.constructor as InjectableType<Component>;
    const map = siblingMap.get(selfType);

    if (!map) {
      return;
    }

    for (const [key, siblingType] of map.entries()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = this.entity.requireComponent(siblingType);
    }
  }

  private resolveEntityLookups() {
    const selfType = this.constructor as InjectableType<Component>;
    const map = entityLookupMap.get(selfType);

    if (!map) {
      return;
    }

    for (const [key, path] of map.entries()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = this.entity.findEntity(path);
    }
  }

  public get entity(): Entity {
    if (!this.#entity) {
      throw new Error(`tried to access component.entity before initialization`);
    }

    return this.#entity;
  }

  public set entity(entity: Entity | undefined) {
    this.#entity = entity;
  }

  set(props: Partial<typeof this>) {
    Object.assign(this, props);
    return this;
  }

  get application() {
    return this.entity?.application;
  }
}

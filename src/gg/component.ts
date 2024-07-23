
import { Canvas } from './canvas';
import { Entity } from './entity';


export interface Component {
  init?(): void;
  destroy?(): void;
  update?(delta: number): void;
  render?(canvas: Canvas): void;
}

export type ComponentDescriptor<T extends Component = any> = { type: string } & Partial<T>;

export type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

const componentNameRegistry = new Map<string, ComponentType>();
const componentRegistry = new Map<new (...args: any[]) => Component, string>();
export function InstantiableComponent(): (target: new (...args: any[]) => Component) => void {
  return (target) => {
    if (componentNameRegistry.has(target.name)) {
      throw new Error(`Component type ${target.name} is already registered`);
    }
    componentNameRegistry.set(target.name, target);
    componentRegistry.set(target, target.name);
  };
}

function getComponentInstance<T extends Component>(
  ctor: new (...args: any[]) => T,
  props: Partial<T>,
) {
  const component = new ctor();
  return component.set(props);
}

function getComponentInstanceById<T extends Component>(name: string, props: Partial<T>) {
  const ctor = componentNameRegistry.get(name);
  if (!ctor) throw new Error(`unknown component type ${name}`);

  return getComponentInstance<T>(ctor as new (...args: any[]) => T, props);
}

const siblingMap = new Map<Object, Map<string | symbol, ComponentType>>();

export function sibling(type: ComponentType): PropertyDecorator {
  return (object, key) => {
    const target = object.constructor;
    if (!siblingMap.has(target)) {
      siblingMap.set(target, new Map());
    }
    siblingMap.get(target)?.set(key, type);
  }
}

const entityLookupMap = new Map<Object, Map<string | symbol, string>>();

export function entityLookup(path: string): PropertyDecorator {
  return (object, key) => {
    const target = object.constructor;
    if (!entityLookupMap.has(target)) {
      entityLookupMap.set(target, new Map());
    }
    entityLookupMap.get(target)?.set(key, path);
  }
}

export abstract class Component {
  static fromDescriptor<T extends Component>({ type: id, ...props }: ComponentDescriptor) {
    return getComponentInstanceById<T>(id, props as Partial<T>);
  }

  static describe<T extends Component = any>(type: ComponentType<T>, descriptor?: Omit<ComponentDescriptor<T>, 'type'>) {
    return {
      ...descriptor ?? {},
      type: type.name
    } as ComponentDescriptor<T>;
  }

  #entity?: Entity;

  constructor(props?: Parameters<typeof this.set>[0]) {
    props && this.set(props);
  }

  onAddedToHierarchy() {
    this.resolveSiblings();
    this.resolveEntityLookups();
    this.init?.();
  }

  private resolveSiblings() {
    const selfType = this.constructor as ComponentType;
    const map = siblingMap.get(selfType);

    if (!map) {
      return;
    }

    for (const [key, siblingType] of map.entries()) {
      (this as any)[key] = this.entity.requireComponent(siblingType);
    }
  }

  private resolveEntityLookups() {
    const selfType = this.constructor as ComponentType;
    const map = entityLookupMap.get(selfType);

    if (!map) {
      return;
    }

    for (const [key, path] of map.entries()) {
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
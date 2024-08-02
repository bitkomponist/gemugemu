import { Entity } from './entity';
import { getInjectableType, InjectableType } from './injection';
import { Observable, ObservableEventMap } from './observable';
import { System } from './system';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentDescriptor<T extends Component = any> = { type: string } & Partial<T>;

/**
 * Instantiates a component of a given class and sets its properties up in one go
 *
 * @param ctor - Component class to instantiate
 * @param props - Settable properties of the component class
 * @returns Instance of component
 */
function getComponentInstance<T extends Component>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctor: new (...args: any[]) => T,
  props: Partial<T>,
) {
  const component = new ctor();
  return component.set(props);
}

/**
 * Instantiates a component of a given class name and sets its properties up in one go
 *
 * @param name - Component class name as registered per injection decorator
 * @param props - Settable properties of the component class
 * @returns
 */
function getComponentInstanceById<T extends Component>(name: string, props: Partial<T>) {
  const ctor = getInjectableType<T>(name);
  if (!ctor) throw new Error(`unknown component type ${name}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getComponentInstance<T>(ctor as new (...args: any[]) => T, props);
}

/** Registry for component properties to inject siblings into */
const siblingMap = new Map<object, Map<string | symbol, InjectableType<Component>>>();

/**
 * Decorator to inject references to sibling components into the targeted component class property
 *
 * @example
 *
 * ```
 * class Mycomponent {
 *   @sibling(TransformComponent) transform!: TransformComponent;
 * }
 * ```
 *
 * @param type - Component class to search for in the siblings of the target component
 * @returns Decorated component class property
 */
export function sibling(type: InjectableType<Component>): PropertyDecorator {
  return (object, key) => {
    const target = object.constructor;
    if (!siblingMap.has(target)) {
      siblingMap.set(target, new Map());
    }
    siblingMap.get(target)?.set(key, type);
  };
}

/** Registry for component properties to inject entities into */
const entityLookupMap = new Map<object, Map<string | symbol, string>>();

/**
 * Decorator to inject references to foreign entities of the hierarchy into the targeted component
 * class property
 *
 * @example
 *
 * ```
 * class Mycomponent {
 *   @entityLookup('/some-root-entity-id') rootEntity!: Entity;
 * }
 * ```
 *
 * @param path - Entity path to search for
 * @returns Decorated component class property
 * @see Entity.findEntity
 */
export function entityLookup(path: string): PropertyDecorator {
  return (object, key) => {
    const target = object.constructor;
    if (!entityLookupMap.has(target)) {
      entityLookupMap.set(target, new Map());
    }
    entityLookupMap.get(target)?.set(key, path);
  };
}

export type ComponentEventMap = ObservableEventMap & {
  'added-to-hierarchy': object;
  'removed-from-hierarchy': object;
};

export abstract class Component<
  TEventMap extends ComponentEventMap = ComponentEventMap,
> extends Observable<TEventMap> {
  /**
   * Optional callback called when the component is first fully added to the hierarchy (parent and
   * application are set)
   */
  init?(): void;

  /** Optional callback called when the component is removed from the hierarchy */
  destroy?(): void;

  /**
   * Create a component instance based on a given configuration
   *
   * @param descriptor - Configuration to construct the component with
   * @returns Component
   */
  static fromDescriptor<T extends Component>({ type: id, ...props }: ComponentDescriptor) {
    return getComponentInstanceById<T>(id, props as Partial<T>);
  }

  /**
   * Creates a descriptor to construct instances of this component with
   *
   * @param type - Class to construct a descriptor for
   * @param descriptor - Configuration to set on a component instance created with this descriptor
   * @returns
   */
  static describe<T extends Component = Component>(
    type: InjectableType<T>,
    descriptor?: Omit<ComponentDescriptor<T>, 'type'>,
  ) {
    return {
      ...(descriptor ?? {}),
      type: type.name,
    } as ComponentDescriptor<T>;
  }

  /** Parent entity */
  private _entity?: Entity;

  /**
   * Get a new instance of this component type
   *
   * @param props - Configuration to set on this component
   */
  constructor(props?: object) {
    super();
    this.on('added-to-hierarchy', this.onAddedToHierarchy.bind(this));
    this.on('removed-from-hierarchy', this.onRemovedFromHierarchy.bind(this));
    props && this.set(props);
  }

  /**
   * Search for the first occurance of a specific component type instance in the siblings of this
   * component
   *
   * @param ctor - Component class to search for
   * @returns Resolved instance (if any)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    return this.entity.getComponent(ctor);
  }

  /**
   * Search for the first occurance of a specific component type instance in the siblings of this
   * component, throw error if none are found
   *
   * @param ctor - Component class to search for
   * @returns Resolved instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    return this.entity.requireComponent(ctor);
  }

  /**
   * Search for the first occurance of a specific system type instance in the systems of this
   * components root application
   *
   * @param ctor - System class to search for
   * @returns Resolved instance (if any)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSystem<T extends System>(ctor: new (...args: any[]) => T) {
    return this.entity.getSystem(ctor);
  }

  /**
   * Search for the first occurance of a specific system type instance in the systems of this
   * components root application, throw error if none is found
   *
   * @param ctor - System class to search for
   * @returns Resolved instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireSystem<T extends System>(ctor: new (...args: any[]) => T) {
    return this.entity.requireSystem(ctor);
  }

  /** Internal flag to track if this component was initialized upon beeing added to the hierarchy */
  protected initialized: boolean = false;

  /**
   * Private callback upon beeing added to hierarchy, first resolves dependencies, then executes
   * internal init callback
   */
  protected onAddedToHierarchy() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.resolveSiblings();
    this.resolveEntityLookups();
    this.init?.();
  }

  /** Private callback upon beeing removed from hierarchy */
  protected onRemovedFromHierarchy() {
    this.initialized = false;
    this.destroy?.();
  }

  /** Resolve dependencies added with `@sibling` decorators */
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

  /** Resolve dependencies added with `@entityLookup` decorators */
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

  /** Get the parent entity, throws error when accessed before initialization */
  public get entity(): Entity {
    if (!this._entity) {
      throw new Error(`tried to access component.entity before initialization`);
    }

    return this._entity;
  }

  /** Set the parent entity of this component */
  public set entity(entity: Entity | undefined) {
    this._entity = entity;
  }

  /**
   * Set arbitrary properties of this instance. use with care, since we dont check here if those
   * props are valid or not
   *
   * @param props - Partial props of this component
   * @returns Self
   */
  set(props: object) {
    Object.assign(this, props);
    return this;
  }

  /** Get the root application of which's hierarchy this component is part of */
  get application() {
    return this.entity?.application;
  }
}

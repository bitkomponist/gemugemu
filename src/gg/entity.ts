import { Component, ComponentDescriptor } from './component';
import { EntityContainer, EntityContainerItem } from './entity-container';
import { getInjectableType, InjectableType } from './injection';
import { ObservableList } from './observable-list';
import { Prefab } from './prefab';
import { System } from './system';

/** Interface with properties necessary to instantiate a application object */
export type EntityDescriptor = {
  prefab?: string | { type: string; [prop: string]: unknown };
  id?: string;
  components?: ComponentDescriptor[];
  entities?: EntityDescriptor[];
};

/** Counter used when autogenerating entity id's */
let entityCount = 0;
export class Entity extends EntityContainer {
  /**
   * Invoked before a component will be added
   *
   * @param component - That was will be added
   */
  onAddComponent?(component: Component): void;
  /**
   * Invoked after a component was added
   *
   * @param component - That was just added
   */
  onComponentAdded?(component: Component): void;
  /**
   * Invoked before a component will be removed
   *
   * @param component - That was will be removed
   */
  onRemoveComponent?(component: Component): void;
  /**
   * Invoked after a component was removed
   *
   * @param component - That was just removed
   */
  onComponentRemoved?(component: Component): void;

  /** Set the parent container and emit hierarchy callbacks */
  set parent(parent: EntityContainer | undefined) {
    if (parent === this._parent) {
      return;
    }

    this._parent = parent;

    if (parent && this.application) {
      for (const component of this.components) {
        component.onAddedToHierarchy();
      }
    } else if (!parent) {
      for (const component of this.components) {
        component.onRemovedFromHierarchy();
      }
    }
  }

  /**
   * Create a prefab-instance from a prefab descriptor
   *
   * @param descriptor - Prefab configuration
   * @returns Entity
   */
  static fromPrefab(descriptor: Exclude<EntityDescriptor['prefab'], undefined>) {
    let Type: InjectableType<Prefab> | undefined;
    let props: Record<string, unknown> = {};
    if (typeof descriptor === 'string') {
      Type = getInjectableType<Prefab>(descriptor);
    } else {
      const { type: typeName, ...prefabProps } = descriptor;
      Type = getInjectableType<Prefab>(typeName);
      props = prefabProps;
    }

    if (!Type) {
      throw new Error(`unknown prefab type ${descriptor}`);
    }
    const instance = new Type();
    return Entity.fromDescriptor(instance.describe(props));
  }

  /**
   * Create an entity instance based on a static descriptor configuration
   *
   * @param descriptor - Entity configuration to use during construction
   * @returns Entity
   */
  static fromDescriptor({
    prefab,
    id,
    components: componentDescriptors,
    entities: entityDescriptors,
  }: EntityDescriptor): Entity {
    if (prefab) {
      return Entity.fromPrefab(prefab);
    }

    const components =
      componentDescriptors?.map((descriptor) => {
        return Component.fromDescriptor(descriptor);
      }) ?? [];

    const entities =
      entityDescriptors?.map((descriptor) => {
        return Entity.fromDescriptor(descriptor);
      }) ?? [];

    return new Entity(id ?? `E${++entityCount}`, components, entities);
  }

  /** Get a descriptor from a descriptor-like object */
  static describe(descriptor?: EntityDescriptor) {
    return {
      ...(descriptor ?? {}),
    } as EntityDescriptor;
  }

  /** List of components of this entity, with observers to react to adding and removing of items */
  private _components = new ObservableList<Component>({
    /**
     * Emit callback before adding a component
     *
     * @param component - To be added
     * @returns Nothing
     */
    adding: (component) => this.onAddComponent?.(component),
    /**
     * Emit callback after adding a component, emitting hierarchy callbacks on it and adding
     * assigning its entity relation
     *
     * @param component - That was added
     * @returns Nothing
     */
    added: (component) => {
      if (component instanceof Component) {
        component.entity = this;
        // when already in root hierarchy, initialize
        if (this.application) {
          component.onAddedToHierarchy();
        }
      }

      this.onComponentAdded?.(component);
    },
    /**
     * Emit callback before removing a component, emitting hierarchy callbacks on it and removing
     * its parent entity relation
     *
     * @param component - That will be removed
     * @returns Nothing
     */
    removing: (component) => {
      this.onRemoveComponent?.(component);
      component.onRemovedFromHierarchy();
      component.entity = undefined;
    },
    /**
     * Emit callback after removing a component
     *
     * @param component - That was removed
     * @returns Nothing
     */
    removed: (component) => this.onComponentRemoved?.(component),
  });

  /**
   * Create a new entity instance
   *
   * @param id - To identify the entity by, e.g. for searching
   * @param components - To apply on this entity
   * @param entities - To nest under this as their parent
   */
  constructor(
    public readonly id: string,
    components: Component[] = [],
    entities: EntityContainerItem[] = [],
  ) {
    super();
    this.entities.add(...entities);
    this._components.add(...components);
  }

  /** Get observable list of components in this entity */
  get components() {
    return this._components;
  }

  /**
   * Finds the first component instance on this entity, that is instance of ctor
   *
   * @param ctor - Target components class
   * @returns Instance of ctor if found
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    return this.components.find((component): component is T => component instanceof ctor) as
      | T
      | undefined;
  }

  /**
   * Finds the first component instance on this entity, that is instance of ctor. throws error if
   * none is found
   *
   * @param ctor - Target components class
   * @returns Instance of ctor
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    const component = this.getComponent(ctor);
    if (!component) {
      throw new Error(`Entity ${this.id} required missing component of type ${ctor.name}`);
    }
    return component;
  }

  /**
   * Finds the first system instance on this entities affiliated application, that is instance of
   * ctor
   *
   * @param ctor - Target system class
   * @returns Instance of ctor if found
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSystem<T extends System>(ctor: new (...args: any[]) => T) {
    return this.application?.systems?.find((system): system is T => system instanceof ctor);
  }

  /**
   * Finds the first system instance on this entities affiliated application, that is instance of
   * ctor. throws error if none is found
   *
   * @param ctor - Target system class
   * @returns Instance of ctor
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requireSystem<T extends System>(ctor: new (...args: any[]) => T) {
    const system = this.getSystem(ctor);
    if (!system) {
      throw new Error(`Entity ${this.id} required missing system of type ${ctor.name}`);
    }
    return system;
  }

  /**
   * Finds a entity in the hierarchy based on a absolute or relative path of id's,
   *
   * @example
   *
   * ```
   * entity.findEntity('nested/child/entity-id');
   * entity.findEntity('../sibling/entity-id');
   * entity.findEntity('/root/entity-id');
   * ```
   *
   * @param path - The absolute or relative entity path
   * @returns The resolved entity if any
   */
  findEntity(path: string) {
    if (!path.startsWith('.') && !path.startsWith('/')) {
      path = `./${path}`;
    }

    function traverse(entity: Entity | undefined, segments: string[]): Entity | undefined {
      if (!entity) return undefined;

      const [segment, ...nextSegments] = segments;

      if (segment === '.') {
        return traverse(entity, nextSegments);
      }

      if (segment === '..') {
        return traverse(entity.parent as Entity, nextSegments);
      }

      for (const child of entity.entities) {
        if ('id' in child && child.id === segment) {
          if (!nextSegments.length) {
            return child;
          } else {
            return traverse(child, nextSegments);
          }
        }
      }

      return undefined;
    }

    const relative = path.startsWith('.');

    if (path.startsWith('/')) {
      path = path.slice(1);
    }

    const root = relative ? this : this.application?.root;

    return traverse(root as Entity, path.split('/'));
  }
}

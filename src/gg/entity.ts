import { Application } from './application';
import { Component, ComponentDescriptor } from './component';
import { getInjectableType, InjectableType } from './injection';
import { Observable, ObservableEventMap } from './observable';
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

export type EntityEventMap = ObservableEventMap & {
  /**
   * Invoked before a entity will be added
   *
   * @param entity - That was will be added
   */
  'add-entity': { entity: Entity };
  /**
   * Invoked after a entity was added
   *
   * @param entity - That was just added
   */
  'entity-added': { entity: Entity };
  /**
   * Invoked before a entity will be removed
   *
   * @param entity - That was will be removed
   */
  'remove-entity': { entity: Entity };
  /**
   * Invoked after a entity was removed
   *
   * @param entity - That was just removed
   */
  'entity-removed': { entity: Entity };

  /**
   * Invoked before a component will be added
   *
   * @param component - That was will be added
   */
  'add-component': { component: Component };
  /**
   * Invoked after a component was added
   *
   * @param component - That was just added
   */
  'component-added': { component: Component };
  /**
   * Invoked before a component will be removed
   *
   * @param component - That was will be removed
   */
  'remove-component': { component: Component };
  /**
   * Invoked after a component was removed
   *
   * @param component - That was just removed
   */
  'component-removed': { component: Component };
};

/** Counter used when autogenerating entity id's */
let entityCount = 0;
export class Entity extends Observable<EntityEventMap> {
  /** Reference to the parent container object (undefined if this is the root) */
  protected _parent?: Entity;

  /** Get the current parent container (undefined if this is the root) */
  get parent() {
    return this._parent;
  }

  /** Set the parent container and emit hierarchy callbacks */
  set parent(parent: Entity | undefined) {
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

  /** Reference to the application which this container belongs to its hierarchy */
  private _application?: Application;

  /** List of children of this container, with observers to react to adding and removing of items */
  private _entities = new ObservableList<Entity>({
    /**
     * Emit callback before adding an entity
     *
     * @param entity - To be added
     * @returns Nothing
     */
    adding: ({ item: entity }) => this.emit('add-entity', { entity }),

    /**
     * Emit callback after adding an entity and registering it in the current hierarchy
     *
     * @param entity - That was just added
     */
    added: ({ item: entity }) => {
      if (entity.parent && entity.parent !== this) {
        throw new Error(`tried to add entity to multiple containers`);
      }
      entity.parent = this;
      this.emit('entity-added', { entity });
    },

    /**
     * Emit callback before removing an entity and removing it from the current hierarchy
     *
     * @param entity - To be removed
     * @returns Nothing
     */
    removing: ({ item: entity }) => {
      this.emit('remove-entity', { entity });
      entity.parent = undefined;
    },
    /**
     * Emit callback after removing an entity
     *
     * @param entity - That was just removed
     */
    removed: ({ item: entity }) => this.emit('entity-removed', { entity }),
  });

  /**
   * Set the application to which hierarchy this container belongs. Should the application exist,
   * also initializes all child components deeply nested in this container.
   */
  set application(application: Application | undefined) {
    const prev = this.application;

    // recursively set reference to application on root
    if (this.parent) {
      this.parent.application = application;
    } else {
      // this is root, so set application here
      this._application = application;
    }

    if (!prev && application) {
      for (const entity of this.getGrandChildren()) {
        if (!('components' in entity)) continue;

        for (const comp of entity.components) {
          comp.onAddedToHierarchy();
        }
      }
    }
  }

  /** Get the current application this container is part of */
  get application() {
    return this.parent ? this.parent.application : this._application;
  }

  /** Get observable list of entities in this container */
  get entities() {
    return this._entities;
  }

  /** Gather all deeply nested components which are (grand-)parented by this container */
  getGrandChildren() {
    const result: Entity[] = [];
    for (const child of this._entities) {
      result.push(child);
      result.push(...child.getGrandChildren());
    }
    return result;
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
    adding: ({ item: component }) => this.emit('add-component', { component }),
    /**
     * Emit callback after adding a component, emitting hierarchy callbacks on it and adding
     * assigning its entity relation
     *
     * @param component - That was added
     * @returns Nothing
     */
    added: ({ item: component }) => {
      if (component instanceof Component) {
        component.entity = this;
        // when already in root hierarchy, initialize
        if (this.application) {
          component.onAddedToHierarchy();
        }
      }

      this.emit('component-added', { component });
    },
    /**
     * Emit callback before removing a component, emitting hierarchy callbacks on it and removing
     * its parent entity relation
     *
     * @param component - That will be removed
     * @returns Nothing
     */
    removing: ({ item: component }) => {
      this.emit('remove-component', { component });
      component.onRemovedFromHierarchy();
      component.entity = undefined;
    },
    /**
     * Emit callback after removing a component
     *
     * @param component - That was removed
     * @returns Nothing
     */
    removed: ({ item: component }) => this.emit('component-removed', { component }),
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
    entities: Entity[] = [],
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

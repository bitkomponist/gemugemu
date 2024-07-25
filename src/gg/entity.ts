import { Application } from './application';
import { Component, ComponentDescriptor } from './component';
import { prefabNameRegistry, PrefabType } from './prefab';
import { System } from './system';

export type Observer<T extends object> = {
  deleteProperty?: (target: T[], property: string | symbol) => void,
  set?: (target: T[], property: string | symbol, value: any) => void,
}

export class EntityContainer {
  protected _parent?: EntityContainer;

  get parent() {
    return this._parent;
  }

  set parent(parent: EntityContainer | undefined) {
    this._parent = parent;
  }

  #entitiesObservers: Observer<Entity>[] = [];
  #application?: Application;
  #entities: Entity[] = [];
  #entitiesProxy = new Proxy(this.#entities, {
    deleteProperty: (target, property) => {
      const entity = target[property as any];

      for (const observer of this.#entitiesObservers) {
        observer.deleteProperty?.(target, property);
      }

      delete target[property as any];
      entity.parent = undefined;

      // todo, destroy component
      return true;
    },
    set: (target, property, value) => {
      target[property as any] = value;
      if (value instanceof Entity) {
        if (value.parent) {
          throw new Error(`tried to add entity to multiple containers`);
        }
        value.parent = this;

        for (const observer of this.#entitiesObservers) {
          observer.set?.(target, property, value);
        }

        // todo, initialization;
      }
      return true;
    },
  });

  observeEntities(observer: Observer<Entity>) {
    this.#entitiesObservers.push(observer);
    return this;
  }

  unobserveEntities(observer: Observer<Entity>) {
    const index = this.#entitiesObservers.indexOf(observer);
    if (index > -1) {
      this.#entitiesObservers.splice(index, 1);
    }
    return this;
  }

  set application(application: Application | undefined) {
    const prev = this.application;

    // recursively set reference to application on root
    if (this.parent) {
      this.parent.application = application;
    } else {
      // this is root, so set application here
      this.#application = application;
    }

    if (!prev && application) {
      for (const entity of this.getGrandChildren()) {
        for (const comp of entity.components ?? []) {
          comp.onAddedToHierarchy();
        }
      }
    }
  }

  get application() {
    return this.parent ? this.parent.application : this.#application;
  }

  get entities() {
    return this.#entitiesProxy;
  }

  set entities(entities: Entity[]) {
    const proxy = this.#entitiesProxy;
    proxy.splice(0, proxy.length);
    proxy.push(...entities);
  }

  getGrandChildren() {
    const result: Entity[] = [];
    for (const child of this.#entities) {
      result.push(child);
      result.push(...child.getGrandChildren());
    }
    return result;
  }
}

export type EntityDescriptor = {
  prefab?: string | { type: string, [prop: string]: unknown };
  id?: string;
  components?: ComponentDescriptor[];
  entities?: EntityDescriptor[];
};

let entityCount = 0;

export class Entity extends EntityContainer {
  get parent() {
    return this._parent;
  }

  set parent(parent: EntityContainer | undefined) {
    if (parent === this._parent) {
      return;
    }

    this._parent = parent;

    if (parent && this.application) {
      this.components.forEach(c => c.onAddedToHierarchy());
    } else if (!parent) {
      this.components.forEach(c => c.onRemovedFromHierarchy());
    }
  }

  static fromPrefab(descriptor: Exclude<EntityDescriptor['prefab'], undefined>) {
    let Type: PrefabType | undefined;
    let props: Record<string, unknown> = {};
    if (typeof descriptor === 'string') {
      Type = prefabNameRegistry.get(descriptor);
    } else {
      const { type: typeName, ...prefabProps } = descriptor;
      Type = prefabNameRegistry.get(typeName);
      props = prefabProps;
    }

    if (!Type) {
      throw new Error(`unknown prefab type ${descriptor}`);
    }
    const instance = new Type();
    return Entity.fromDescriptor(instance.describe(props));
  }

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

  static describe(descriptor?: EntityDescriptor) {
    return {
      ...descriptor ?? {},
    } as EntityDescriptor;
  }
  #components: Component[] = [];
  #componentsObservers: Observer<Component>[] = [];
  #componentsProxy = new Proxy(this.#components, {
    deleteProperty: (target, property) => {
      const component = target[property as any];

      for (const observer of this.#componentsObservers) {
        observer.deleteProperty?.(target, property);
      }

      component.onRemovedFromHierarchy();

      delete target[property as any];
      component.entity = undefined;

      return true;
    },
    set: (target, property, value) => {
      target[property as any] = value;
      if (value instanceof Component) {
        value.entity = this;
        // when already in root hierarchy, initialize
        if (this.application) {
          value.onAddedToHierarchy();
        }
      }
      for (const observer of this.#componentsObservers) {
        observer.set?.(target, property, value);
      }
      return true;
    },
  });

  observeComponents(observer: Observer<Component>) {
    this.#componentsObservers.push(observer);
    return this;
  }

  unobserveComponents(observer: Observer<Component>) {
    const index = this.#componentsObservers.indexOf(observer);
    if (index > -1) {
      this.#componentsObservers.splice(index, 1);
    }
    return this;
  }

  constructor(
    public readonly id: string,
    components: Component[] = [],
    entities: Entity[] = [],
  ) {
    super();
    this.entities = entities;
    this.components = components;
  }

  get components() {
    return this.#componentsProxy;
  }

  set components(components: Component[]) {
    const proxy = this.#componentsProxy;
    proxy.splice(0, proxy.length);
    proxy.push(...components);
  }

  getComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    return this.components.find((component): component is T => component instanceof ctor);
  }

  requireComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    const component = this.getComponent(ctor);
    if (!component) {
      throw new Error(`Entity ${this.id} required missing component of type ${ctor.name}`);
    }
    return component;
  }

  getSystem<T extends System>(ctor: new (...args: any[]) => T) {
    return this.application?.systems?.find((system): system is T => system instanceof ctor);
  }

  requireSystem<T extends System>(ctor: new (...args: any[]) => T) {
    const system = this.getSystem(ctor);
    if (!system) {
      throw new Error(`Entity ${this.id} required missing system of type ${ctor.name}`);
    }
    return system;
  }

  findEntity(path: string) {
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
        if (child.id === segment) {
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

    let root = relative ? this : this.application?.root;

    return traverse(root as Entity, path.split('/'));

  }
}
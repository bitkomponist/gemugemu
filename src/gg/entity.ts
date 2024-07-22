import { merge } from 'lodash';
import { Application } from './application';
import { Component, ComponentDescriptor } from './component';
export class EntityContainer {
  parent?: EntityContainer;
  #application?: Application;
  #entities: Entity[] = [];
  #entitiesProxy = new Proxy(this.#entities, {
    deleteProperty: (target, property) => {
      const entity = target[property as any];
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

        // todo, initialization;
      }
      return true;
    },
  });

  set application(application: Application | undefined) {
    const prev = this.application;

    if (this.parent) {
      this.parent.application = application;
    } else {
      this.#application = application;
    }

    if (!prev && application) {
      for (const entity of this.entities) {
        for (const comp of entity.components) {
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
  id?: string;
  components?: ComponentDescriptor[];
  entities?: EntityDescriptor[];
};

let entityCount = 0;

export class Entity extends EntityContainer {


  static fromDescriptor({
    id,
    components: componentDescriptors,
    entities: entityDescriptors,
  }: EntityDescriptor): Entity {
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
  #componentsProxy = new Proxy(this.#components, {
    deleteProperty: (target, property) => {
      const component = target[property as any];
      delete target[property as any];
      component.entity = undefined;
      component.destroy?.();
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
      return true;
    },
  });

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

  findEntity(path: string) {
    function traverse(currentEntity: Entity | undefined, segments: string[]): Entity | undefined {
      if (!currentEntity) return undefined;

      if (!segments.length) {
        return currentEntity;
      }

      const [segment, ...childSegments] = segments;

      if (segment === '.' || currentEntity?.id === segment) {
        return traverse(currentEntity, childSegments);
      }

      if (segment === '..') {
        return traverse(currentEntity.parent as Entity, childSegments);
      }

      for (const child of currentEntity.entities) {
        const childResult = traverse(child, childSegments);
        if (childResult) {
          return childResult;
        }
      }

      return undefined;
    }

    const relative = path.startsWith('.');

    let root = relative ? this : this.application?.root;

    return traverse(root as Entity, path.split('/'));

  }
}

export function createPrefab<P extends object = any>(descriptor: (props?: P) => EntityDescriptor) {
  return (propsWithOverrides: Partial<P> & { overrides?: Partial<EntityDescriptor> } = {}) => {
    const { overrides, ...props } = propsWithOverrides;
    return Entity.describe(
      merge<EntityDescriptor, Partial<EntityDescriptor>>(
        descriptor(props as P),
        overrides ?? {},
      ));
  };
}

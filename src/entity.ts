import { Component, ComponentDescriptor } from "./component";

export class EntityContainer {
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
    }
  })

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
  id?: string,
  components?: ComponentDescriptor[]
  entities?: EntityDescriptor[]
}

let entityCount = 0;

export class Entity extends EntityContainer {
  parent?: EntityContainer;

  static fromDescriptor({ id, components: componentDescriptors, entities: entityDescriptors }: EntityDescriptor): Entity {
    const components = componentDescriptors?.map(descriptor => {
      return Component.fromDescriptor(descriptor);
    }) ?? [];

    const entities = entityDescriptors?.map(descriptor => {
      return Entity.fromDescriptor(descriptor);
    }) ?? [];

    return new Entity(id ?? `E${entityCount}`, components, entities);
  }

  #components: Component[] = [];
  #componentsProxy = new Proxy(this.#components, {
    deleteProperty: (target, property) => {
      const component = target[property as any];
      delete target[property as any];
      component.entity = undefined;
      // todo, destroy component
      return true;
    },
    set: (target, property, value) => {
      target[property as any] = value;
      if (value instanceof Component) {
        value.entity = this;
        // todo, initialization;
      }
      return true;
    }
  });

  constructor(public readonly id: string, components: Component[] = [], entities: Entity[] = []) {
    super();
    this.components = components;
    this.entities = entities;
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
}
import { Application } from './application';
import { Entity } from './entity';

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
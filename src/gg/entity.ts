import { Component, ComponentDescriptor } from './component';
import { EntityContainer, EntityContainerItem } from './entity-container';
import { ObservableList } from './observable-list';
import { prefabNameRegistry, PrefabType } from './prefab';
import { System } from './system';

export type EntityDescriptor = {
  prefab?: string | { type: string, [prop: string]: unknown };
  id?: string;
  components?: ComponentDescriptor[];
  entities?: EntityDescriptor[];
};

let entityCount = 0;

export interface Entity {
  /**
   * invoked before a component will be added
   * @param component that was will be added
   */
  onAddComponent?(component: Component): void;
  /**
   * invoked after a component was added
   * @param component that was just added
   */
  onComponentAdded?(component: Component): void;
  /**
   * invoked before a component will be removed
   * @param component that was will be removed
   */
  onRemoveComponent?(component: Component): void;
  /**
   * invoked after a component was removed
   * @param component that was just removed
   */
  onComponentRemoved?(component: Component): void;
}

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
      for (const component of this.components) {
        component.onAddedToHierarchy();
      }
    } else if (!parent) {
      for (const component of this.components) {
        component.onRemovedFromHierarchy();
      }
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
  #components = new ObservableList<Component>({
    adding: (component) => this.onAddComponent?.(component),
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
    removing: (component) => {
      this.onRemoveComponent?.(component);
      component.onRemovedFromHierarchy();
      component.entity = undefined;
    },
    removed: (component) => this.onComponentRemoved?.(component)
  });

  constructor(
    public readonly id: string,
    components: Component[] = [],
    entities: EntityContainerItem[] = [],
  ) {
    super();
    this.entities.add(...entities);
    this.#components.add(...components);
  }

  get components() {
    return this.#components;
  }

  getComponent<T extends Component>(ctor: new (...args: any[]) => T) {
    return this.components.find((component): component is T => component instanceof ctor) as T | undefined;
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
        if ("id" in child && child.id === segment) {
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
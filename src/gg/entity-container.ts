import { Application } from './application';
import { Entity } from './entity';
import { ObservableList } from './observable-list';

export type EntityContainerItem = Entity | EntityContainer;

export interface EntityContainer {
  /**
   * invoked before a entity will be added
   * @param entity that was will be added
   */
  onAddEntity?(entity: EntityContainerItem): void;
  /**
   * invoked after a entity was added
   * @param entity that was just added
   */
  onEntityAdded?(entity: EntityContainerItem): void;
  /**
   * invoked before a entity will be removed
   * @param entity that was will be removed
   */
  onRemoveEntity?(entity: EntityContainerItem): void;
  /**
   * invoked after a entity was removed
   * @param entity that was just removed
   */
  onEntityRemoved?(entity: EntityContainerItem): void;
}

export class EntityContainer {
  protected _parent?: EntityContainer;

  get parent() {
    return this._parent;
  }

  set parent(parent: EntityContainer | undefined) {
    this._parent = parent;
  }

  #application?: Application;

  #entities = new ObservableList<EntityContainerItem>({
    adding: (entity) => this.onAddEntity?.(entity),
    added: (entity) => {
      if (entity.parent && entity.parent !== this) {
        throw new Error(`tried to add entity to multiple containers`);
      }
      entity.parent = this;
      this.onEntityAdded?.(entity);
    },
    removing: (entity) => {
      this.onRemoveEntity?.(entity);
      entity.parent = undefined;
    },
    removed: (entity) => this.onEntityRemoved?.(entity),
  });

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
        if (!('components' in entity)) continue;
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
    return this.#entities;
  }

  getGrandChildren() {
    const result: EntityContainerItem[] = [];
    for (const child of this.#entities) {
      result.push(child);
      result.push(...child.getGrandChildren());
    }
    return result;
  }
}

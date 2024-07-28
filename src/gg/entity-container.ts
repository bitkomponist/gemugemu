import { Application } from './application';
import { Entity } from './entity';
import { ObservableList } from './observable-list';

/** Union of types that can be added to a EntityContainer object */
export type EntityContainerItem = Entity | EntityContainer;

/** Container for objects to be considered in the application hierarchy */
export class EntityContainer {
  /**
   * Invoked before a entity will be added
   *
   * @param entity - That was will be added
   */
  onAddEntity?(entity: EntityContainerItem): void;
  /**
   * Invoked after a entity was added
   *
   * @param entity - That was just added
   */
  onEntityAdded?(entity: EntityContainerItem): void;
  /**
   * Invoked before a entity will be removed
   *
   * @param entity - That was will be removed
   */
  onRemoveEntity?(entity: EntityContainerItem): void;
  /**
   * Invoked after a entity was removed
   *
   * @param entity - That was just removed
   */
  onEntityRemoved?(entity: EntityContainerItem): void;

  /** Reference to the parent container object (undefined if this is the root) */
  protected _parent?: EntityContainer;

  /** Get the current parent container (undefined if this is the root) */
  get parent() {
    return this._parent;
  }

  /** Set the parent container */
  set parent(parent: EntityContainer | undefined) {
    this._parent = parent;
  }

  /** Reference to the application which this container belongs to its hierarchy */
  private _application?: Application;

  /** List of children of this container, with observers to react to adding and removing of items */
  private _entities = new ObservableList<EntityContainerItem>({
    /**
     * Emit callback before adding an entity
     *
     * @param entity - To be added
     * @returns Nothing
     */
    adding: (entity) => this.onAddEntity?.(entity),

    /**
     * Emit callback after adding an entity and registering it in the current hierarchy
     *
     * @param entity - That was just added
     */
    added: (entity) => {
      if (entity.parent && entity.parent !== this) {
        throw new Error(`tried to add entity to multiple containers`);
      }
      entity.parent = this;
      this.onEntityAdded?.(entity);
    },

    /**
     * Emit callback before removing an entity and removing it from the current hierarchy
     *
     * @param entity - To be removed
     * @returns Nothing
     */
    removing: (entity) => {
      this.onRemoveEntity?.(entity);
      entity.parent = undefined;
    },
    /**
     * Emit callback after removing an entity
     *
     * @param entity - That was just removed
     */
    removed: (entity) => this.onEntityRemoved?.(entity),
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
    const result: EntityContainerItem[] = [];
    for (const child of this._entities) {
      result.push(child);
      result.push(...child.getGrandChildren());
    }
    return result;
  }
}

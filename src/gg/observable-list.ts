import { Observable, ObserverEventSubscription } from './observable';

/** Object of supported observable list callbacks */
export type ListObserver<T = unknown> = {
  adding?(item: T, target: ObservableList<T>): void;
  added?(item: T, target: ObservableList<T>): void;
  removing?(item: T, target: ObservableList<T>): void;
  removed?(item: T, target: ObservableList<T>): void;
};

type ObservableListEventMap<T = unknown> = {
  adding: { item: T; target: ObservableList<T> };
  added: { item: T; target: ObservableList<T> };
  removing: { item: T; target: ObservableList<T> };
  removed: { item: T; target: ObservableList<T> };
};

/**
 * List class with a subset of array methods and the ability to observe when elements are added or
 * removed
 */
export class ObservableList<T = unknown> {
  private _observer = new Observable<ObservableListEventMap<T>>();

  get observer() {
    return this._observer;
  }

  /** Internal storage of the list items */
  private items: T[] = [];

  /**
   * Get a observable list instance
   *
   * @param observers - Initial Event subscriptions
   * @param distinct - Wether to allow each item only once in the array
   */
  constructor(
    observers?: ObserverEventSubscription<ObservableListEventMap<T>>,
    private distinct = true,
  ) {
    observers && this.observer.subscribe(observers);
  }

  /**
   * Add an arbitrary number of items to the list, ignore duplicates if distinct flag is set
   *
   * @param items - To add to the list
   * @returns This list
   */
  add(...items: T[]) {
    for (const item of items) {
      if (this.distinct && this.items.includes(item)) {
        continue;
      }

      this.observer.emit('adding', { item, target: this });
      this.items.push(item);
      this.observer.emit('added', { item, target: this });
    }

    return this;
  }

  /**
   * Takes an integer value and returns the item at that index, allowing for positive and negative
   * integers. Negative integers count back from the last item in the array.
   *
   * @param index - Target index
   * @returns Item at index
   */
  at(index: number) {
    return this.items.at(index);
  }

  /**
   * Returns the index of the first occurrence of a value in an array, or -1 if it is not present.
   *
   * @param item - The value to locate in the array.
   * @param fromIndex - The array index at which to begin the search. If fromIndex is omitted, the
   *   search starts at index 0.
   * @returns Resolved index or -1 if none found
   */
  indexOf(item: T, fromIndex = 0) {
    return this.items.indexOf(item, fromIndex);
  }

  /**
   * Determines whether an array includes a certain item, returning true or false as appropriate.
   *
   * @param item - The item to search for
   * @param fromIndex - The position in this array at which to begin searching for searchItem
   * @returns Item found or not
   */
  includes(item: T, fromIndex = 0) {
    return this.items.includes(item, fromIndex);
  }

  /**
   * Removes all current items from the list
   *
   * @returns This list
   */
  empty() {
    while (this.length) {
      this.removeAt(0);
    }

    return this;
  }

  /**
   * Returns the value of the first item in the array where predicate is true, and undefined
   * otherwise.
   *
   * @param predicate - Find calls predicate once for each element of the array, in ascending order,
   *   until it finds one where predicate returns true. If such an element is found, find
   *   immediately returns that element value. Otherwise, find returns undefined.
   * @param thisArg - If provided, it will be used as the this value for each invocation of
   *   predicate. If it is not provided, undefined is used instead.
   * @returns Resolved item
   */
  find<S extends T>(...args: Parameters<typeof this.items.find<S>>) {
    return this.items.find<T>(...args);
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.items.length) {
      throw new Error(`list does not include given index`);
    }

    const item = this.items[index];

    this.observer.emit('removing', { item, target: this });
    this.items.splice(index, 1);
    this.observer.emit('removed', { item, target: this });

    return this;
  }

  /**
   * Remove an arbitrary number of items from the list
   *
   * @param items - To remove from the list
   * @returns This list
   */
  remove(...items: T[]) {
    for (const item of items) {
      this.removeAt(this.items.indexOf(item));
    }

    return this;
  }

  /** The number of items currently in this list */
  get length() {
    return this.items.length;
  }

  /**
   * Get an iterator for this list
   *
   * @returns New iterator to step through this list
   */
  [Symbol.iterator]() {
    let index = -1;
    const { items } = this;

    return {
      next: () => ({ value: items[++index], done: !(index in items) }),
    };
  }
}

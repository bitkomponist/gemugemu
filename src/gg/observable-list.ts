
export type ListObserver<T = any> = {
  adding?(item: T, target: ObservableList<T>): void;
  added?(item: T, target: ObservableList<T>): void;
  removing?(item: T, target: ObservableList<T>): void;
  removed?(item: T, target: ObservableList<T>): void;
}

export class ObservableList<T = any> {
  private items: T[] = [];


  constructor(private observer?: ListObserver<T>, initialItems: T[] = [], private distinct = true) {
    for (const item of initialItems) {
      this.add(item);
    }
  }

  add(...items: T[]) {
    for (const item of items) {
      if (this.distinct && this.items.includes(item)) {
        continue;
      }

      this.observer?.adding?.(item, this);
      this.items.push(item);
      this.observer?.added?.(item, this);
    }

    return this;
  }

  at(index: number) {
    return this.items.at(index);
  }

  indexOf(item: T) {
    return this.items.indexOf(item);
  }

  includes(item: T) {
    return this.items.includes(item);
  }

  empty() {
    while (this.length) {
      this.removeAt(0);
    }

    return this;
  }

  find<S extends T>(...args: Parameters<typeof this.items.find<S>>) {
    return this.items.find<T>(...args);
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.items.length) {
      throw new Error(`list does not include given index`);
    }

    const item = this.items[index];

    this.observer?.removing?.(item, this);
    this.items.splice(index, 1);
    this.observer?.removed?.(item, this);

    return this;
  }

  remove(...items: T[]) {
    for (const item of items) {
      this.removeAt(this.items.indexOf(item));
    }

    return this;
  }

  get length() {
    return this.items.length;
  }

  [Symbol.iterator]() {
    let index = -1;
    const { items } = this;

    return {
      next: () => ({ value: items[++index], done: !(index in items) })
    };
  };
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type ObservableEventMap = object;

export type ObserverEventListener<
  TEventMap extends ObservableEventMap,
  K extends keyof TEventMap,
> = (event: TEventMap[K]) => void;

export type ObserverEventSubscription<TEventMap extends ObservableEventMap> = {
  [key in keyof TEventMap]: ObserverEventListener<TEventMap, key>;
};

export class Observable<TEventMap extends ObservableEventMap = ObservableEventMap> {
  private _observers?: Map<keyof TEventMap, Set<ObserverEventListener<TEventMap, keyof TEventMap>>>;
  on<K extends keyof TEventMap>(type: K, observer: ObserverEventListener<TEventMap, K>) {
    this._observers ??= new Map();
    if (!this._observers.has(type)) {
      this._observers.set(type, new Set());
    }
    this._observers.get(type)?.add(observer as ObserverEventListener<TEventMap, keyof TEventMap>);

    return () => {
      this.off(type, observer);
    };
  }

  off<K extends keyof TEventMap>(type: K, observer: ObserverEventListener<TEventMap, K>) {
    this._observers ??= new Map();
    if (!this._observers.has(type)) {
      this._observers.set(type, new Set());
    }
    this._observers
      .get(type)
      ?.delete(observer as ObserverEventListener<TEventMap, keyof TEventMap>);
  }

  emit<K extends keyof TEventMap>(event: { type: K } & TEventMap[K]) {
    const { type, ...eventData } = event;
    this._observers?.get(type)?.forEach((observer) => {
      observer(eventData as TEventMap[K]);
    });
    return this;
  }

  subscribe(observers: ObserverEventSubscription<TEventMap>) {
    const offs = Object.entries(observers).map(([type, observer]) =>
      this.on(
        type as keyof TEventMap,
        observer as ObserverEventListener<TEventMap, keyof TEventMap>,
      ),
    );

    return () => {
      offs.forEach((unregister) => unregister());
    };
  }
}

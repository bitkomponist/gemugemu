// eslint-disable-next-line @typescript-eslint/ban-types
export type ObserverEventMap = {};

export type ObserverListener<TEventMap extends ObserverEventMap, K extends keyof TEventMap> = (
  event: TEventMap[K],
) => void;

export type ObserverSubscribption<TEventMap extends ObserverEventMap> = {
  [key in keyof TEventMap]: ObserverListener<TEventMap, key>;
};

export class Observer<TEventMap extends ObserverEventMap = ObserverEventMap> {
  private _observers?: Map<keyof TEventMap, Set<ObserverListener<TEventMap, keyof TEventMap>>>;
  on<K extends keyof TEventMap>(type: K, observer: ObserverListener<TEventMap, K>) {
    this._observers ??= new Map();
    if (!this._observers.has(type)) {
      this._observers.set(type, new Set());
    }
    this._observers.get(type)?.add(observer as ObserverListener<TEventMap, keyof TEventMap>);

    return () => {
      this.off(type, observer);
    };
  }

  off<K extends keyof TEventMap>(type: K, observer: ObserverListener<TEventMap, K>) {
    this._observers ??= new Map();
    if (!this._observers.has(type)) {
      this._observers.set(type, new Set());
    }
    this._observers.get(type)?.delete(observer as ObserverListener<TEventMap, keyof TEventMap>);
  }

  emit<K extends keyof TEventMap>(type: K, eventData: TEventMap[K]) {
    //if(!this._observers?.get(type)?.size) return this;
    this._observers?.get(type)?.forEach((observer) => {
      observer(eventData);
    });
    return this;
  }

  subscribe(observers: ObserverSubscribption<TEventMap>) {
    const offs = Object.entries(observers).map(([type, observer]) =>
      this.on(type as keyof TEventMap, observer as ObserverListener<TEventMap, keyof TEventMap>),
    );

    return () => {
      offs.forEach((unregister) => unregister());
    };
  }
}

// type MyClassEventMap<I extends object = object> = ObserverEventMap & {
//   stop: {target:I}
// }

// class MyClass<I extends object = object> extends Observer<MyClassEventMap<I>> {
//   get greeting(){
//       return 'hi';
//   }
// }

// class MyChildClass extends MyClass<{test:string}> {
//   get greeting(){
//       return 'ho';
//   }
// }

// const instance = new MyChildClass();
// instance.emit('stop',{target:{test:'1'}});

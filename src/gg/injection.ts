// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InjectableType<T extends object = object> = new (...args: any[]) => T;

const typeNameRegistry = new Map<string, InjectableType>();

const typeRegistry = new Map<InjectableType, string>();

export function Injectable(): (target: InjectableType) => void {
  return (target) => {
    if (typeNameRegistry.has(target.name)) {
      throw new Error(`Type ${target.name} is already registered`);
    }
    typeNameRegistry.set(target.name, target);
    typeRegistry.set(target, target.name);
  };
}

export function getInjectableType<T extends object = object>(typeName: string) {
  return typeNameRegistry.get(typeName) as InjectableType<T> | undefined;
}

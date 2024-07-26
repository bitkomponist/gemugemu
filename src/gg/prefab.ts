import { merge } from "lodash";
import { Entity, EntityDescriptor } from "./entity";

export abstract class Prefab<P extends object = any> {
  protected abstract build(props?: P): EntityDescriptor;
  describe(propsWithOverrides: Partial<P> & { overrides?: Partial<EntityDescriptor> } = {}) {
    const { overrides, ...props } = propsWithOverrides;
    return Entity.describe(
      merge<EntityDescriptor, Partial<EntityDescriptor>>(
        this.build(props as P),
        overrides ?? {},
      ));
  }
}

export type PrefabDescriptor<T extends Prefab = any> = { type: string } & Partial<T>;

export type PrefabType<T extends Prefab = Prefab> = new (...args: any[]) => T;

export const prefabNameRegistry = new Map<string, PrefabType>();

const prefabRegistry = new Map<PrefabType, string>();

export function RegisteredPrefab(): (target: PrefabType) => void {
  return (target) => {
    if (prefabNameRegistry.has(target.name)) {
      throw new Error(`Prefab type ${target.name} is already registered`);
    }
    prefabNameRegistry.set(target.name, target);
    prefabRegistry.set(target, target.name);
  };
}
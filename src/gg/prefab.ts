import { merge } from 'lodash';
import { Entity, EntityDescriptor } from './entity';

export abstract class Prefab<P extends object = object> {
  protected abstract build(props?: P): EntityDescriptor;
  describe(propsWithOverrides: Partial<P> & { overrides?: Partial<EntityDescriptor> } = {}) {
    const { overrides, ...props } = propsWithOverrides;
    const descriptor = this.build(props as P);
    return Entity.describe(
      merge<EntityDescriptor, Partial<EntityDescriptor>>(descriptor, {
        ...(overrides ?? {}),
        components: [...(descriptor.components ?? []), ...(overrides?.components ?? [])],
        entities: [...(descriptor.entities ?? []), ...(overrides?.entities ?? [])],
      }),
    );
  }
}

export type PrefabDescriptor<T extends Prefab = Prefab> = { type: string } & Partial<T>;

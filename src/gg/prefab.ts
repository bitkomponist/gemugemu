import { merge } from 'lodash';
import { Entity, EntityDescriptor } from './entity';

/**
 * Abstract class to compose building blocks, partial bits of hierarchy (e.g. partial entity trees),
 * with optional custom properties
 */
export abstract class Prefab<P extends object = object> {
  /**
   * Build a custom partial entity hierarchy / tree to reuse inside of your application
   *
   * @param props - Custom properties to modify the resulting entity descriptor with
   */
  protected abstract build(props?: P): EntityDescriptor;

  /**
   * Create a descriptor of this prefab, with optional overrides
   *
   * @param propsWithOverrides - Custom properties to modify the resulting entity descriptor with,
   *   merge with custom overrides to further modify
   * @returns Descriptor result
   */
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

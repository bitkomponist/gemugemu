import { Component } from '@gg/component';
import { Shape } from '@gg/components/shape.component';
import { Transform2d } from '@gg/components/transform-2d.component';
import { EntityDescriptor } from '@gg/entity';
import { vec2 } from '@gg/math';
import { Prefab, RegisteredPrefab } from '@gg/prefab';

interface OriginGraphProps {
  size?: number;
  color?: string;
  lineWidth?: number;
}
export @RegisteredPrefab() class OriginGraph extends Prefab {
  protected build({ size = 10, color = '#aaffff', lineWidth = 2 }: OriginGraphProps): EntityDescriptor {
    return {
      id: 'origin-graph',
      components: [
        Component.describe(Transform2d, { position: vec2(size * -0.5, size * -0.5) }),
        Component.describe(Shape, {
          stroke: color,
          lineWidth,
          path: `m 0 ${size * 0.5} l ${size} ${size * 0.5} m ${size * 0.5} 0 l ${size * 0.5} ${size}`,
          cache: vec2(size, size),
        })
      ],
    };
  }
}
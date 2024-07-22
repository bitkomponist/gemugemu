import { createPrefab } from '~/gg/entity';
import { Shape } from '~/gg/shape.component';
import { Transform } from '~/gg/transform.component';

export const OriginGraphPrefab = createPrefab(
  ({
    size = 10,
    color: stroke = '#aaffff',
    lineWidth = 2,
  }: { size?: number; color?: string; lineWidth?: number } = {}) => ({
    id: 'origin-graph',
    components: [
      { type: Transform.name, position: { x: size * -0.5, y: size * -0.5 } },
      {
        type: Shape.name,
        stroke,
        lineWidth,
        path: `m 0 ${size * 0.5} l ${size} ${size * 0.5} m ${size * 0.5} 0 l ${size * 0.5} ${size}`,
        cache: { x: size, y: size },
      },
    ],
  }),
);

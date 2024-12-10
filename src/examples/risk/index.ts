import { Application } from '@gg/application';
import { RiskWorldEnvironmentPrefab } from './world-environment';

export const initRisk = () =>
  Application.fromDescriptor({
    root: {
      entities: [
        {
          prefab: { type: RiskWorldEnvironmentPrefab.name, overrides: { id: 'world-environment' } },
        },
        {
          id: 'main-camera',
          components: [{ type: 'TransformComponent' }, { type: 'CameraComponent' }],
        },
      ],
    },
  });

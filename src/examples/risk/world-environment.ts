import { EntityDescriptor } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { Prefab } from '@gg/prefab';

@Injectable()
export class RiskWorldEnvironmentPrefab extends Prefab {
  protected build(): EntityDescriptor {
    return {
      id: 'risk-world-environment',
      components: [{ type: 'TransformComponent' }, { type: 'SkyComponent' }],
    };
  }
}

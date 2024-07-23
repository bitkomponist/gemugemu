import { ApplicationDescriptor } from '@gg/application';
import { BreakoutBallPrefab } from './ball';
import { BreakoutBricksPrefab } from './bricks';
import { BreakoutPlayerPrefab } from './player';

export const Breakout: ApplicationDescriptor = {
  root: {
    entities: [
      BreakoutBricksPrefab(),
      BreakoutPlayerPrefab(),
      BreakoutBallPrefab(),
    ]
  }
}
import { ApplicationDescriptor } from './application';
import { BreakoutBricksPrefab } from './breakout/bricks';
import { BreakoutPlayerPrefab } from './breakout/player';

export const Breakout: ApplicationDescriptor = {
  root: {
    entities: [
      BreakoutBricksPrefab(),
      BreakoutPlayerPrefab()
    ]
  }
}
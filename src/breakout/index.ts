import { ApplicationDescriptor } from '@gg/application';
import { BreakoutBall } from './ball';
import { BreakoutBricks } from './bricks';
import { BreakoutPlayer } from './player';

export const Breakout: ApplicationDescriptor = {
  systems: [
    { type: 'ComponentManager' },
    { type: 'Renderer2d' },
  ],
  root: {
    entities: [
      { prefab: BreakoutBricks.name },
      { prefab: BreakoutPlayer.name },
      { prefab: BreakoutBall.name },
    ]
  }
}
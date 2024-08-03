import { Application } from '@gg/application';
import { Component, entityLookup } from '@gg/component';
import { Entity } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { InputManagerSystem } from '@gg/systems/input-manager.system';
import { PongBall, PongBallPrefab } from './ball';
import { CollisionManager } from './collision';
import { PongRacket, PongRacketPlayerControls, PongRacketPrefab } from './racket';

@Injectable()
class PongControllerComponent extends Component {
  @entityLookup('/pong-ball') ball!: Entity;
  @entityLookup('/player-right') playerRight!: Entity;
  @entityLookup('/player-left') playerLeft!: Entity;
  private input!: InputManagerSystem;

  init() {
    this.reset();
    this.input = this.requireSystem(InputManagerSystem);
  }

  async reset() {
    const components = [
      this.ball.requireComponent(PongBall),
      this.playerRight.requireComponent(PongRacket),
      this.playerLeft.requireComponent(PongRacket),
    ];
    await Promise.all(components.map((comp) => comp.ready));
    components.forEach((comp) => comp.reset());
  }

  update(): void {
    this.input.isKeyPressed('Enter') && this.reset();
  }
}

export const initPong = () =>
  Application.fromDescriptor({
    systems: [{ type: CollisionManager.name }],
    root: {
      entities: [
        { id: 'game-controller', components: [{ type: PongControllerComponent.name }] },
        {
          components: [
            { type: 'TransformComponent', position: { x: 0, y: 0, z: 1 } },
            { type: 'OrthographicCameraComponent', frustumSize: 7 },
          ],
        },
        {
          prefab: {
            type: PongRacketPrefab.name,
            position: { x: 5, y: 0, z: 0 },
            overrides: {
              id: 'player-right',
              components: [{ type: PongRacketPlayerControls.name }],
            },
          },
        },
        {
          prefab: {
            type: PongRacketPrefab.name,
            position: { x: -5, y: 0, z: 0 },
            overrides: {
              id: 'player-left',
              components: [{ type: PongRacketPlayerControls.name, upKey: 'w', downKey: 's' }],
            },
          },
        },
        { prefab: { type: PongBallPrefab.name, overrides: { id: 'pong-ball' } } },
      ],
    },
  });

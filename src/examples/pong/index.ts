import { Application } from '@gg/application';
import { Component, ComponentEventMap, entityLookup, sibling } from '@gg/component';
import { TextSpriteComponent } from '@gg/components/text-sprite.component';
import { Entity, EntityDescriptor } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { Prefab } from '@gg/prefab';
import { InputManagerSystem } from '@gg/systems/input-manager.system';
import { Vector3Like } from 'three/src/Three.js';
import { PongBall, PongBallPrefab } from './ball';
import { CollisionManager } from './collision';
import { PongRacket, PongRacketPlayerControls, PongRacketPrefab } from './racket';

@Injectable()
export class ScoreUiComponent extends Component {
  @sibling(TextSpriteComponent) textSprite!: TextSpriteComponent;

  _score = 0;

  racketPath?: string;
  racket?: PongRacket;

  get score() {
    return this._score;
  }

  set score(score: number) {
    if (score === this._score) return;
    this._score = score;
    this.updateText();
  }

  updateText() {
    this.textSprite.text = String(this._score).padStart(2, '0');
  }

  init() {
    if (this.racketPath) {
      this.racket = this.entity.findEntity(this.racketPath)?.getComponent(PongRacket);
      this.update();
    }
    this.updateText();
  }

  update() {
    if (this.racket) {
      this.score = this.racket.score;
    }
  }
}

@Injectable()
export class PongPlayerScoreUiPrefab extends Prefab {
  protected build({
    position,
    racketPath,
  }: { position?: Vector3Like; racketPath?: string } = {}): EntityDescriptor {
    return {
      id: 'player-score',
      components: [
        {
          type: 'TransformComponent',
          position: position ?? { x: 0, y: 3, z: 0 },
        },
        {
          type: 'TextSpriteComponent',
          font: '48px monospace',
          fill: '#ffffff',
        },
        {
          type: ScoreUiComponent.name,
          racketPath,
        },
      ],
    };
  }
}

type PongControllerEventMap = ComponentEventMap & {
  'game-start': object;
  'game-end': object;
};

@Injectable()
class PongControllerComponent extends Component<PongControllerEventMap> {
  @entityLookup('/pong-ball') ball!: Entity;
  @entityLookup('/player-right') playerRight!: Entity;
  @entityLookup('/player-left') playerLeft!: Entity;
  private input!: InputManagerSystem;
  maxScore = 15;

  init() {
    this.reset();
    this.input = this.requireSystem(InputManagerSystem);
    this.ball.requireComponent(PongBall).on('out-of-bounds', ({ side }) => {
      const scorerEntity = side === 'left' ? this.playerRight : this.playerLeft;
      const scorerRacket = scorerEntity.requireComponent(PongRacket);
      scorerRacket.score += 1;

      if (scorerRacket.score >= this.maxScore) {
        this.emit({ type: 'game-end' });
      }
    });
  }

  async reset() {
    const components = [
      this.ball.requireComponent(PongBall),
      this.playerRight.requireComponent(PongRacket),
      this.playerLeft.requireComponent(PongRacket),
    ];
    await Promise.all(components.map((comp) => comp.ready));
    components.forEach((comp) => comp.reset());
    this.emit({ type: 'game-start' });
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
        {
          prefab: {
            type: PongPlayerScoreUiPrefab.name,
            racketPath: '/player-left',
            position: { x: -2.5, y: 2.7, z: 0 },
            overrides: { id: 'player-left-score' },
          },
        },
        {
          prefab: {
            type: PongPlayerScoreUiPrefab.name,
            racketPath: '/player-right',
            position: { x: 2.5, y: 2.7, z: 0 },
            overrides: { id: 'player-right-score' },
          },
        },
      ],
    },
  });

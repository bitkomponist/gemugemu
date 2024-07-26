import { Application } from "@gg/application";
import { Component, RegisteredComponent, sibling } from "@gg/component";
import { CanvasSprite } from "@gg/components/canvas-sprite.component";
import { Transform } from "@gg/components/transform.component";
import { EntityDescriptor } from "@gg/entity";
import { isKeyPressed } from "@gg/keyboard";
import { Prefab, RegisteredPrefab } from "@gg/prefab";
import { Vector3, Vector3Like } from "three/src/Three.js";

@RegisteredComponent() class PongRacket extends Component {
  private positionTarget = new Vector3();

  speed = .1;

  dampening = 1;

  impulse = 0;

  @sibling(Transform) transform!: Transform;

  @sibling(CanvasSprite) canvas!: CanvasSprite;

  init(): void {
    this.positionTarget.copy(this.transform.position);
    const { context } = this.canvas;
    // context.fillStyle = '#111111';
    // context.fillRect(0, 0, this.canvas.size, this.canvas.size);
    context.fillStyle = '#ffffff';
    context.fillRect(this.canvas.size / 3, 0, this.canvas.size / 3, this.canvas.size);

  }

  update(delta: number): void {
    if (this.impulse !== 0) {
      this.positionTarget.y += this.impulse * this.speed;
      this.positionTarget.y = Math.min(2, Math.max(-2, this.positionTarget.y));
    }

    this.transform.position.y += (this.positionTarget.y - this.transform.position.y) / (this.dampening * delta);

  }
}

@RegisteredComponent() class PongRacketPlayerControls extends Component {

  upKey = 'ArrowUp';
  downKey = 'ArrowDown';

  @sibling(PongRacket) racket!: PongRacket;

  update(): void {
    if (isKeyPressed(this.upKey)) {
      this.racket.impulse = 1;
    } else if (isKeyPressed(this.downKey)) {
      this.racket.impulse = -1;
    } else {
      this.racket.impulse = 0;
    }
  }
}


@RegisteredComponent() class PongBall extends Component {
  @sibling(CanvasSprite) canvas!: CanvasSprite;
  @sibling(Transform) transform!: Transform;

  init(): void {
    const { context, size } = this.canvas;
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI, false);
    context.closePath();
    context.fill();
  }
}

@RegisteredPrefab() class PongRacketPrefab extends Prefab {
  protected build({ position = { x: 0, y: 0, z: 0 } }: { position?: Vector3Like } = {}): EntityDescriptor {
    return {
      id: 'pong-racket',
      components: [
        { type: 'Transform', position },
        { type: 'Sprite' },
        { type: 'CanvasSprite' },
        { type: PongRacket.name }
      ]
    }
  }
}

@RegisteredPrefab() class PongBallPrefab extends Prefab {
  protected build({ position = { x: 0, y: 0, z: 0 } }: { position?: Vector3Like } = {}): EntityDescriptor {
    return {
      id: 'pong-ball',
      components: [
        { type: 'Transform', position, scale: { x: .5, y: .5, z: 1 } },
        { type: 'Sprite' },
        { type: 'CanvasSprite' },
        { type: PongBall.name }
      ]
    }
  }
}

export const initPong = () => Application.fromDescriptor({
  root: {
    entities: [
      {
        components: [
          { type: 'Transform', position: { x: 0, y: 0, z: 1 } },
          { type: 'OrthographicCamera', frustumSize: 7 }
        ]
      },
      { prefab: { type: PongRacketPrefab.name, position: { x: 5, y: 0, z: 0 }, overrides: { components: [{ type: PongRacketPlayerControls.name }] } } },
      { prefab: { type: PongRacketPrefab.name, position: { x: -5, y: 0, z: 0 }, overrides: { components: [{ type: PongRacketPlayerControls.name, upKey: 'w', downKey: 's' }] } } },
      { prefab: { type: PongBallPrefab.name } }
    ]
  }
})
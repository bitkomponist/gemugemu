import { Application } from './application';
import { Canvas } from './canvas';
import { Component, InstantiableComponent } from './component';
import { Entity, EntityDescriptor } from './entity';
import { Vector2 } from './math';
import './style.css'
import { Transform } from './transform.component';

export @InstantiableComponent() class Orbiter extends Component {
  center: Vector2 = { x: 200, y: 200 };
  distance = 100;
  speed = .001;
  angle = 0;

  update(delta: number): void {
    this.angle += delta * this.speed;
    const transform = this.entity.requireComponent(Transform);
    transform.position.x = this.center.x + Math.sin(this.angle) * this.distance;
    transform.position.y = this.center.y + Math.cos(this.angle) * this.distance;
    transform.rotation += delta * this.speed;
  }
}

export @InstantiableComponent() class RectShape extends Component {
  fill = '#00ff00';
  size: Vector2 = { x: 10, y: 10 };

  render({ context }: Canvas): void {
    context.fillStyle = this.fill;
    context.fillRect(0, 0, this.size.x, this.size.y);
  }
}


function RotatingRectPrefab(overrides: Partial<EntityDescriptor> = {}): EntityDescriptor {
  return {
    ...overrides,
    components: [
      ...overrides.components ?? [],
      {
        type: 'Transform',
        pivot: { x: 5, y: 5 }
      },
      {
        type: 'Orbiter',
      },
      {
        type: 'RectShape'
      }
    ]
  }
}

class Snek extends Application {
  root = Entity.fromDescriptor({
    entities: [
      RotatingRectPrefab(),
      {
        components: [
          {
            type: 'Transform',
            pivot: { x: 15, y: 15 }
          },
          {
            type: 'Orbiter',
            angle: 200,
            speed: .003,
            distance: 75
          },
          {
            type: 'RectShape',
            size: { x: 30, y: 30 },
            fill: '#ff0000'
          }
        ]
      },
      {
        components: [
          {
            type: 'Transform',
            pivot: { x: 10, y: 10 }
          },
          {
            type: 'Orbiter',
            angle: 100,
            speed: .002,
            distance: 50
          },
          {
            type: 'RectShape',
            size: { x: 20, y: 20 },
            fill: '#0000ff'
          }
        ]
      }
    ]
  })
}

console.log(new Snek().start());
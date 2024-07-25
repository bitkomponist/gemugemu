import { Application, ApplicationDescriptor } from '@gg/application';
// import { Breakout } from '~/breakout';
import { Component, RegisteredComponent, sibling } from '@gg/component';
import { Transform3d } from '@gg/components/transform-3d.component';
import { Entity } from '@gg/entity';
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three/src/Three.js';
import './style.css';

@RegisteredComponent() class DemoCube extends Component {
  private cube?: Mesh;
  @sibling(Transform3d) private transform!: Transform3d;
  init(): void {
    console.log('creating cube on ', this.transform.object3d.parent);
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    this.cube = new Mesh(geometry, material);
    this.transform.object3d.add(this.cube);
  }

  update(delta: number) {
    if (!this.cube) return;
    this.cube.rotation.x += delta * 0.001;
    this.cube.rotation.y += delta * 0.001;
  }
}

@RegisteredComponent() export class EmitCubesOverTime extends Component {
  init() {
    const cubes: Entity[] = [];

    const spawnDespawn = () => {
      const cube = Entity.fromDescriptor({
        components: [
          { type: 'Transform3d', position: { x: -1 + Math.random() * 2, y: -1 + Math.random() * 2, z: -1 + Math.random() * 2 } },
          { type: 'DemoCube' }
        ]
      });

      const { entities } = this.entity;
      cubes.push(cube);
      entities.add(cube);

      if (cubes.length > 1) {
        const remove = cubes.shift()!;
        console.log('removing', remove.id);
        entities.remove(remove);
        console.log('rest', cubes);
      }
    }

    setInterval(spawnDespawn, 500);
  }
}


export const ThreeTest: ApplicationDescriptor = {
  systems: [
    { type: 'ComponentManager' },
    { type: 'Renderer3d' },
  ],
  root: {
    entities: [
      {
        id: 'camera', components: [
          { type: 'Transform3d', position: { x: 1.5, y: 0, z: 5 } },
          { type: 'Camera3d' }
        ]
      },
      {
        id: 'parent',
        components: [
          { type: 'Transform3d' },
          { type: DemoCube.name }
        ],
        entities: [
          {
            id: 'child',
            components: [
              { type: 'Transform3d', position: { x: 1.5, y: 0, z: 0 } },
              { type: DemoCube.name }
            ],
            entities: [
              {
                id: 'grandchild',
                components: [
                  { type: 'Transform3d', position: { x: 1.5, y: 0, z: 0 } },
                  { type: 'EmitCubesOverTime' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

const app = Application.fromDescriptor(ThreeTest).start();
console.log(app);
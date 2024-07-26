import { Application } from '@gg/application';
import { Component, RegisteredComponent, sibling } from '@gg/component';
import { Transform3d } from '@gg/components/transform-3d.component';
import { Entity } from '@gg/entity';
import { Renderer3d } from '@gg/systems/renderer-3d.system';
import { Fog } from 'three/src/Three.js';
import doge from '~/assets/doge.png';


@RegisteredComponent() export class LinearRotation extends Component {
  @sibling(Transform3d) private transform!: Transform3d;

  update(delta: number) {
    this.transform.rotation.x += delta * 0.001;
    this.transform.rotation.y += delta * 0.0005;
    // this.transform.rotation.z += delta * 0.001;
  }
}

@RegisteredComponent() export class EmitDogesOverTime extends Component {
  init() {
    const cubes: Entity[] = [];

    const { scene } = this.requireSystem(Renderer3d);

    scene.fog = new Fog(0x000000, 2, 8);

    const spawnDespawn = () => {
      const cube = Entity.fromDescriptor({
        components: [
          { type: 'Transform3d', scale: { x: .25, y: .25, z: .25 }, position: { x: -4 + Math.random() * 8, y: -4 + Math.random() * 8, z: -4 + Math.random() * 8 } },
          { type: 'Sprite3d', texturePath: doge }
        ]
      });

      const { entities } = this.entity;
      cubes.push(cube);
      entities.add(cube);

      if (cubes.length > 1000) {
        const remove = cubes.shift()!;
        entities.remove(remove);
      }
    }

    setInterval(spawnDespawn, 25);
  }
}


export const initDogeCloud = () => Application.fromDescriptor({
  systems: [
    { type: 'ComponentManager' },
    { type: 'ResourceManager' },
    { type: 'Renderer3d' },
  ],
  root: {
    entities: [
      {
        id: 'camera', components: [
          { type: 'Transform3d', position: { x: 0, y: 0, z: 5 } },
          { type: 'Camera3d' }
        ]
      },
      {
        id: 'parent',
        components: [
          { type: 'Transform3d' },
          { type: 'LinearRotation' }
        ],
        entities: [
          {
            id: 'child',
            components: [
              { type: 'Transform3d', position: { x: 1.5, y: 0, z: 0 } },
            ],
            entities: [
              {
                id: 'grandchild',
                components: [
                  { type: 'Transform3d', position: { x: -1.5, y: 0, z: 0 } },
                  { type: 'EmitDogesOverTime' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
})
import { Application } from '@gg/application';
import { Component, sibling } from '@gg/component';
import { TransformComponent } from '@gg/components/transform.component';
import { Entity } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { RendererSystem } from '@gg/systems/renderer.system';
import { Fog } from 'three/src/Three.js';
import doge from '~/assets/doge.png';

@Injectable()
export class LinearRotation extends Component {
  @sibling(TransformComponent) private transform!: TransformComponent;

  update(delta: number) {
    this.transform.rotation.x += delta * 0.001;
    this.transform.rotation.y += delta * 0.0005;
    // this.transform.rotation.z += delta * 0.001;
  }
}

@Injectable()
export class EmitDogesOverTime extends Component {
  init() {
    const cubes: Entity[] = [];

    const { scene } = this.requireSystem(RendererSystem);

    scene.fog = new Fog(0x000000, 2, 8);

    const spawnDespawn = () => {
      const cube = Entity.fromDescriptor({
        components: [
          {
            type: 'Transform',
            scale: { x: 0.25, y: 0.25, z: 0.25 },
            position: {
              x: -4 + Math.random() * 8,
              y: -4 + Math.random() * 8,
              z: -4 + Math.random() * 8,
            },
          },
          { type: 'Sprite', texturePath: doge },
        ],
      });

      const { entities } = this.entity;
      cubes.push(cube);
      entities.add(cube);

      if (cubes.length > 1000) {
        const remove = cubes.shift()!;
        entities.remove(remove);
      }
    };

    setInterval(spawnDespawn, 25);
  }
}

export const initDogeCloud = () =>
  Application.fromDescriptor({
    root: {
      entities: [
        {
          id: 'camera',
          components: [{ type: 'Transform', position: { x: 0, y: 0, z: 5 } }, { type: 'Camera' }],
        },
        {
          id: 'parent',
          components: [{ type: 'Transform' }, { type: 'LinearRotation' }],
          entities: [
            {
              id: 'child',
              components: [{ type: 'Transform', position: { x: 1.5, y: 0, z: 0 } }],
              entities: [
                {
                  id: 'grandchild',
                  components: [
                    { type: 'Transform', position: { x: -1.5, y: 0, z: 0 } },
                    { type: 'EmitDogesOverTime' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  });

import { Application, ApplicationDescriptor } from '@gg/application';
// import { Breakout } from '~/breakout';
import { Component, InstantiableComponent, sibling } from '@gg/component';
import { Transform3d } from '@gg/components/transform-3d.component';
import { Renderer3d } from '@gg/systems/renderer-3d.system';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three/src/Three.js';
import './style.css';

@InstantiableComponent() class DemoCamera extends Component {
  init(): void {
    const renderer = this.requireSystem(Renderer3d);

    const camera = new PerspectiveCamera(75, 1024 / 768, 0.1, 1000);
    camera.position.z = 5;
    renderer.camera = camera;
  }
}

@InstantiableComponent() class DemoCube extends Component {
  private cube?: Mesh;

  @sibling(Transform3d) private transform!: Transform3d;

  init(): void {
    const renderer = this.requireSystem(Renderer3d);

    const camera = new PerspectiveCamera(75, 1024 / 768, 0.1, 1000);
    camera.position.z = 5;
    renderer.camera = camera;

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


export const ThreeTest: ApplicationDescriptor = {
  systems: [
    { type: 'ComponentManager' },
    { type: 'Renderer3d' },
  ],
  root: {
    entities: [
      {
        id: 'parent',
        components: [
          { type: 'Transform3d' },
          { type: DemoCamera.name },
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
                  { type: DemoCube.name }
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
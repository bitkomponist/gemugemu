import { TransformComponent } from '@gg/components/transform.component';
import { Injectable } from '@gg/injection';
import Stats from 'three/addons/libs/stats.module.js';
import { ACESFilmicToneMapping, Camera, Scene, WebGLRenderer } from 'three/src/Three.js';
import { Entity } from '../entity';
import { System } from '../system';

export
@Injectable()
class RendererSystem extends System {
  private _scene: Scene = new Scene();
  public camera?: Camera;
  public stats: Stats = new Stats();

  public get scene() {
    return this._scene;
  }

  renderer = new WebGLRenderer({ antialias: true });

  public get container() {
    return document.querySelector('#app')!;
  }

  constructor() {
    super();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.container.appendChild(this.renderer.domElement);
    this.container.appendChild(this.stats.dom);
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initRoot(root: Entity): void {
    const { scene } = this;
    while (scene.children.length) {
      scene.remove(scene.children[0]);
    }

    function addEntityToScene(entity: Entity | Entity) {
      if (entity instanceof Entity) {
        const transform = entity.getComponent(TransformComponent);
        if (transform && !scene.children.includes(transform.object3d)) {
          scene.add(transform.object3d);
        }
      }
    }

    for (const entity of root.entities) {
      addEntityToScene(entity);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  destructRoot(_root: Entity): void {
    /** @todo Implement scene unloading */
  }

  updateRoot(): void {
    if (this._scene && this.camera) {
      this.renderer.render(this._scene, this.camera);
    }
    this.stats.update();
  }
}

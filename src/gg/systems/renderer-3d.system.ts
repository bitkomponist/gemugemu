import { Transform3d } from "@gg/components/transform-3d.component";
import Stats from 'three/addons/libs/stats.module.js';
import { Camera, Scene, WebGLRenderer } from "three/src/Three.js";
import { Entity } from "../entity";
import { EntityContainer } from "../entity-container";
import { RegisteredSystem, System } from "../system";

export @RegisteredSystem() class Renderer3d extends System {
  private scene?: Scene;
  public camera?: Camera;
  public stats: Stats = new Stats();

  renderer = new WebGLRenderer({ antialias: true })

  public get container() {
    return document.querySelector('#app')!;
  }

  constructor() {
    super();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    this.container.appendChild(this.stats.dom);
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initRoot(root: EntityContainer): void {
    const scene = this.scene = new Scene();

    function addEntityToScene(entity: Entity | EntityContainer) {
      if (entity instanceof Entity) {
        const transform = entity.getComponent(Transform3d);
        if (transform && !scene.children.includes(transform.object3d)) {
          scene.add(transform.object3d);
        }
      }
    }

    function removeEntityFromScene(entity: Entity | EntityContainer) {
      if (entity instanceof Entity) {
        const transform = entity.getComponent(Transform3d);
        if (transform && scene.children.includes(transform.object3d)) {
          scene.remove(transform.object3d);
        }
      }
    }

    root.onEntityRemoved = entity => removeEntityFromScene(entity);
    root.onEntityAdded = entity => addEntityToScene(entity);

    for (const entity of root.entities) {
      addEntityToScene(entity);
    }
  }

  destructRoot(root: EntityContainer): void {
    /** @todo implement scene unloading */
  }

  updateRoot(): void {
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    this.stats.update();
  }

}
import { Component, RegisteredComponent, sibling } from "@gg/component";
import { Renderer3d } from "@gg/systems/renderer-3d.system";
import { PerspectiveCamera, Vector2 } from "three/src/Three.js";
import { Transform3d } from "./transform-3d.component";

export @RegisteredComponent() class Camera3d extends Component {
  viewport = new Vector2();

  camera?: PerspectiveCamera;

  @sibling(Transform3d) transform!: Transform3d;

  init(): void {
    const renderer = this.requireSystem(Renderer3d);

    renderer.renderer.getSize(this.viewport);

    this.camera = new PerspectiveCamera(75, this.viewport.x / this.viewport.y, 0.1, 1000);

    renderer.camera = this.camera;

    this.transform.object3d.add(this.camera);

    window.addEventListener('resize', () => {

      if (!this.camera) return;

      renderer.renderer.getSize(this.viewport);

      this.camera.aspect = this.viewport.x / this.viewport.y;

      this.camera.updateProjectionMatrix();

    });
  }
}
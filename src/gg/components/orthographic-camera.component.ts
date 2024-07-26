import { Component, RegisteredComponent, sibling } from "@gg/component";
import { Renderer } from "@gg/systems/renderer.system";
import { OrthographicCamera as ThreeOrthographicCamera, Vector2 } from "three/src/Three.js";
import { Transform } from "./transform.component";

export @RegisteredComponent() class OrthographicCamera extends Component {
  private _viewport = new Vector2(window.innerWidth, window.innerHeight);

  get viewport() {
    return this._viewport;
  }

  private _frustumSize: number = 10;

  get frustumSize() {
    return this._frustumSize;
  }

  set frustumSize(frustumSize: number) {
    this._frustumSize = frustumSize;

    this.updateCameraProjection();
  }

  private _near: number = .1;

  get near() {
    return this._near;
  }

  set near(near: number) {
    this._near = near;

    if (this.camera && "near" in this.camera) {
      this.camera.near = this._near;
      this.updateCameraProjection();
    }
  }

  private _far: number = 2000;

  get far() {
    return this._far;
  }

  set far(far: number) {
    this._far = far;

    if (this.camera && "far" in this.camera) {
      this.camera.far = this._far;
      this.updateCameraProjection();
    }
  }

  private _camera: ThreeOrthographicCamera = new ThreeOrthographicCamera(
    -1,
    1,
    1,
    -1,
    this._near,
    this._far
  );

  get camera() {
    return this._camera;
  }

  @sibling(Transform) transform!: Transform;

  updateCameraProjection() {
    const { camera, frustumSize } = this;
    const aspect = this._viewport.x / this._viewport.y;

    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;

    this.camera.updateProjectionMatrix();
  }

  init(): void {
    const renderer = this.requireSystem(Renderer);
    renderer.camera = this.camera;
    this.transform.object3d.add(this.camera);
    const resize = () => {
      renderer.renderer.getSize(this.viewport);
      this.updateCameraProjection();
    }
    window.addEventListener('resize', resize);
    resize();
  }
}
import { Component, RegisteredComponent, sibling } from '@gg/component';
import { Renderer } from '@gg/systems/renderer.system';
import { PerspectiveCamera, Vector2 } from 'three/src/Three.js';
import { Transform } from './transform.component';

export
@RegisteredComponent()
class Camera extends Component {
  private _viewport = new Vector2(1, 1);

  get viewport() {
    return this._viewport;
  }

  private _near: number = 0.1;

  get near() {
    return this._near;
  }

  set near(near: number) {
    this._near = near;

    if (this.camera && 'near' in this.camera) {
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

    if (this.camera && 'far' in this.camera) {
      this.camera.far = this._far;
      this.updateCameraProjection();
    }
  }

  private _fov: number = 75;

  get fov() {
    return this._fov;
  }

  set fov(fov: number) {
    this._fov = fov;

    if (this.camera && 'fov' in this.camera) {
      this.camera.fov = this._fov;
      this.updateCameraProjection();
    }
  }

  private _camera: PerspectiveCamera = new PerspectiveCamera(this._fov, 1, this._near, this._far);

  get camera() {
    return this._camera;
  }

  @sibling(Transform) transform!: Transform;

  updateCameraProjection() {
    this.camera.aspect = this.viewport.x / this.viewport.y;
    this.camera.updateProjectionMatrix();
  }

  init(): void {
    const renderer = this.requireSystem(Renderer);

    renderer.camera = this.camera;

    this.transform.object3d.add(this.camera);

    const resize = () => {
      renderer.renderer.getSize(this.viewport);
      this.updateCameraProjection();
    };

    window.addEventListener('resize', resize);

    resize();
  }
}

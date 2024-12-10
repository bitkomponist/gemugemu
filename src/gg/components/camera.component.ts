import { bindUi, Component, sibling } from '@gg/component';
import { Injectable } from '@gg/injection';
import { RendererSystem } from '@gg/systems/renderer.system';
import { PerspectiveCamera, Vector2 } from 'three/src/Three.js';
import { TransformComponent } from './transform.component';

export
@Injectable()
class CameraComponent extends Component {
  private _viewport = new Vector2(1, 1);

  get viewport() {
    return this._viewport;
  }

  private _near: number = 0.1;

  @bindUi({ min: 0.1, max: 1000 }) get near() {
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

  @bindUi({ min: 10, max: 10000 }) get far() {
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

  @bindUi({ min: 45, max: 160 }) get fov() {
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

  @sibling(TransformComponent) transform!: TransformComponent;

  updateCameraProjection() {
    this.camera.aspect = this.viewport.x / this.viewport.y;
    this.camera.updateProjectionMatrix();
  }

  init(): void {
    const renderer = this.requireSystem(RendererSystem);

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

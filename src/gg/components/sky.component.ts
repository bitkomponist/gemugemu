import { bindUi, Component, sibling } from '@gg/component';
import { Injectable } from '@gg/injection';
import { RendererSystem } from '@gg/systems/renderer.system';
import { MathUtils, Vector3 } from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { TransformComponent } from './transform.component';

export
@Injectable()
class SkyComponent extends Component {
  private _sky = new Sky();

  get sky() {
    return this._sky;
  }

  protected renderer?: RendererSystem;

  scale = 45000;

  @bindUi({ min: 0, max: 20 }) turbidity = 0.3;
  @bindUi({ min: 0, max: 4 }) rayleigh = 0.7;
  @bindUi({ min: 0, max: 0.1 }) mieCoefficient = 0.035;
  @bindUi({ min: 0, max: 1 }) mieDirectionalG = 0.7;
  @bindUi({ min: 0, max: 90 }) elevation = 25;
  @bindUi({ min: -180, max: 180 }) azimuth = 180;

  @bindUi({ min: 0, max: 3 }) exposure = 0.3;
  protected sun = new Vector3();

  @sibling(TransformComponent) transform!: TransformComponent;

  init() {
    this.sky.scale.setScalar(45000);
    this.transform.object3d.add(this.sky);
    this.renderer = this.requireSystem(RendererSystem);
  }

  update() {
    const { sky, sun } = this;

    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = this.turbidity;
    uniforms['rayleigh'].value = this.rayleigh;
    uniforms['mieCoefficient'].value = this.mieCoefficient;
    uniforms['mieDirectionalG'].value = this.mieDirectionalG;

    const phi = MathUtils.degToRad(90 - this.elevation);
    const theta = MathUtils.degToRad(this.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms['sunPosition'].value.copy(sun);
    if (this.renderer) {
      this.renderer.renderer.toneMappingExposure = this.exposure;
    }
  }
}

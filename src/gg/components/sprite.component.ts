import { Component, RegisteredComponent, sibling } from '@gg/component';
import { ResourceManager } from '@gg/systems/resource-manager.system';
import { SpriteMaterial, Texture, Sprite as ThreeSprite } from 'three/src/Three.js';
import { Transform } from './transform.component';

export
@RegisteredComponent()
class Sprite extends Component {
  sprite: ThreeSprite = new ThreeSprite();
  spriteMaterial: SpriteMaterial = new SpriteMaterial({ color: 0xffffff, fog: true });
  texturePath?: string;

  private _map?: Texture;

  get map() {
    return this._map;
  }

  set map(texture: Texture | undefined) {
    this._map = texture;
    this.spriteMaterial.map = texture ?? null;
    this.spriteMaterial.needsUpdate = true;
    this.sprite.material = this.spriteMaterial;
    this.sprite.visible = !!texture;
  }

  @sibling(Transform) transform!: Transform;

  loadTexture(path: string, onProgress?: (event: ProgressEvent) => void) {
    return this.requireSystem(ResourceManager).textureLoader.loadAsync(path, onProgress);
  }

  async init() {
    this.sprite.visible = false;
    this.transform.object3d.add(this.sprite);
    if (this.texturePath) {
      this.map = await this.loadTexture(this.texturePath);
    }
  }
}

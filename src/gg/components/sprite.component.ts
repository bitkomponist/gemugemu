import { Component, RegisteredComponent, sibling } from "@gg/component";
import { ResourceManager } from "@gg/systems/resource-manager.system";
import { SpriteMaterial, Sprite as ThreeSprite } from "three/src/Three.js";
import { Transform } from "./transform.component";

export @RegisteredComponent() class Sprite extends Component {
  sprite: ThreeSprite = new ThreeSprite();
  spriteMaterial: SpriteMaterial = new SpriteMaterial({ color: 0xffffff, fog: true });
  texturePath?: string;

  @sibling(Transform) transform!: Transform;

  async loadTexture(path: string, onProgress?: (event: ProgressEvent) => void) {
    const map = await this.requireSystem(ResourceManager).textureLoader.loadAsync(path, onProgress);
    this.spriteMaterial.map = map;
    this.spriteMaterial.needsUpdate = true;
    this.sprite.material = this.spriteMaterial;
    this.sprite.visible = true;
  }

  async init() {
    this.sprite.visible = false;
    this.transform.object3d.add(this.sprite);
    if (this.texturePath) {
      this.loadTexture(this.texturePath);
    }
  }
}
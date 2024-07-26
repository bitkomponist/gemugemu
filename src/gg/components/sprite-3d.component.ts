import { Component, RegisteredComponent, sibling } from "@gg/component";
import { ResourceManager } from "@gg/systems/resource-manager.system";
import { Sprite, SpriteMaterial } from "three/src/Three.js";
import { Transform3d } from "./transform-3d.component";

export @RegisteredComponent() class Sprite3d extends Component {
  sprite: Sprite = new Sprite();
  spriteMaterial: SpriteMaterial = new SpriteMaterial({ color: 0xffffff, fog: true });
  texturePath?: string;

  @sibling(Transform3d) transform!: Transform3d;

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
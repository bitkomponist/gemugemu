import { Injectable } from '@gg/injection';
import { LoadingManager, TextureLoader } from 'three/src/Three.js';
import { System } from '../system';

export
@Injectable()
class ResourceManagerSystem extends System {
  private _loadingManager?: LoadingManager;

  /** Will be called when all items finish loading. The default is a function with empty body. */
  private onLoad() {}

  /**
   * Will be called for each loaded item. The default is a function with empty body.
   *
   * @param url - The url of the item just loaded.
   * @param loaded - The number of items already loaded so far.
   * @param total - The total amount of items to be loaded.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onProgress(_url: string, _loaded: number, _total: number) {
    // todo
  }

  /**
   * Will be called when item loading fails. The default is a function with empty body.
   *
   * @param url - The url of the item that errored.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onError(_url: string) {
    // todo
  }

  get loadingManager() {
    if (!this._loadingManager) {
      this._loadingManager = new LoadingManager(
        this.onLoad.bind(this),
        this.onProgress.bind(this),
        this.onError.bind(this),
      );
    }
    return this._loadingManager;
  }

  private _textureLoader?: TextureLoader;

  get textureLoader() {
    if (!this._textureLoader) {
      this._textureLoader = new TextureLoader(this.loadingManager);
    }
    return this._textureLoader;
  }
}

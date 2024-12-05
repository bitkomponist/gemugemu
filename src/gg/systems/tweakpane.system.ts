import { Entity } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { System } from '@gg/system';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { FolderApi, Pane } from 'tweakpane';

export
@Injectable()
class TweakpaneSystem extends System {
  private _pane = (() => {
    const p = new Pane();
    p.registerPlugin(EssentialsPlugin);
    return p;
  })();

  private entityFolderMap: Map<Entity, FolderApi> = new Map();

  public get pane() {
    return this._pane;
  }

  public requireEntityFolder(entity: Entity): FolderApi {
    if (!this.entityFolderMap.has(entity)) {
      this.entityFolderMap.set(
        entity,
        this.pane.addFolder({
          title: entity.path,
          expanded: false,
        }),
      );
    }

    return this.entityFolderMap.get(entity)!;
  }

  public cleanupEntityFolder(entity: Entity) {
    if (!this.entityFolderMap.has(entity)) {
      return;
    }

    const folder = this.entityFolderMap.get(entity)!;

    if (folder.children.length) {
      return;
    }

    this.pane.remove(folder);
    this.entityFolderMap.delete(entity);
  }
}

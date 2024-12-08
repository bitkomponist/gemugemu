import { Entity } from '@gg/entity';
import { Injectable } from '@gg/injection';
import { System } from '@gg/system';
import { EntityTree, SelectEntityEventInit } from '@gg/ui/entity-tree';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { FolderApi, Pane } from 'tweakpane';

export
@Injectable()
class TweakpaneSystem extends System {
  private _container: HTMLDivElement;
  private _pane: Pane;
  private _tree?: EntityTree;

  constructor() {
    super();
    this._container = document.createElement('div');
    Object.assign(this._container.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      bottom: '10px',
      overflow: 'auto',
    });
    document.body.appendChild(this._container);
    this._pane = new Pane({ container: this._container });
    this._pane.registerPlugin(EssentialsPlugin);
  }

  private entityFolderMap: Map<Entity, FolderApi> = new Map();

  public get pane() {
    return this._pane;
  }

  public requireEntityFolder(entity: Entity): FolderApi {
    if (!this.entityFolderMap.has(entity)) {
      const folder = this.pane.addFolder({
        title: entity.path,
      });
      folder.hidden = true;
      this.entityFolderMap.set(entity, folder);
      return folder;
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

  public initRoot(root: Entity): void {
    this._tree = new EntityTree();
    this._tree.addEventListener(
      'select-entity',
      (e: SelectEntityEventInit) => {
        const target = root.findEntity(e.detail!.id);
        if (!target) {
          return;
        }
        this.entityFolderMap.forEach((folder, entity) => {
          folder.hidden = entity !== target;
          folder.expanded = true;
        });
      },
      true,
    );
    if (this._container.firstChild) {
      this._container.insertBefore(this._tree, this._container.firstChild);
    } else {
      this._container.appendChild(this._tree);
    }
    this._tree.sync(root);
  }
}

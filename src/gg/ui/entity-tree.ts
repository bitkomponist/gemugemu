import { Entity } from '@gg/entity';

export type SelectEntityEventData = { id: string };
export type SelectEntityEventInit = CustomEventInit<SelectEntityEventData>;

export class EntityTreeItem extends HTMLElement {
  private _name: string;
  private _isFolder = false;
  private _isOpen: boolean = false;
  private _children: EntityTreeItem[] = [];

  get items() {
    return this._children;
  }

  constructor(
    public id: string,
    name: string,
    public selectable = true,
  ) {
    super();
    this._name = name;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!e.composed) {
        return;
      }
      const [target] = e.composedPath();

      if (!target) {
        return;
      }

      if ((target as HTMLElement).classList.contains('icon')) {
        this.toggleFolder();
      } else if ((target as HTMLElement).tagName === 'BUTTON' && this.selectable) {
        const e = new CustomEvent<SelectEntityEventData>('select-entity', {
          detail: {
            id: this.id,
          },
        });
        this.dispatchEvent(e);
      }
    });
  }

  private render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .item { cursor: pointer; }
          .icon { margin-right: 0px; }
          .folder::before { content: "${this._isOpen ? '📂' : '📁'}";}
          .leaf::before { content: "📦";}
          .children {
            margin-left:1rem;
          }
          button {
            appearance: none;
            border: none;
            background none;
            font-family: Roboto Mono, Source Code Pro, Menlo, Courier, monospace;
            font-size: 11px;
            font-weight: 500;
            padding: 5px;
            color: hsl(230, 7%, 75%);
            margin:0;
            padding:3px;
            border-radius: 2px;
          }
        </style>
        <div class="item">
          <span class="icon ${this._isFolder ? 'folder' : 'leaf'}"></span> <button>${this._name}</button>
        </div>
        ${this._isOpen ? '<div class="children"><slot></slot></div>' : ''}
      `;
    }
  }

  private toggleFolder = () => {
    if (this._isFolder) {
      this._isOpen = !this._isOpen;
      this.render();
    }
  };

  addItem(child: EntityTreeItem) {
    const wasFolder = this._isFolder;
    this._isFolder = true;
    this._children.push(child);
    this.appendChild(child);

    if (wasFolder !== this._isFolder) {
      this.render();
    }
  }

  removeItem(child: EntityTreeItem) {
    const index = this._children.indexOf(child);
    if (index > -1) {
      this.removeChild(child);
      this._children.splice(index, 1);
      const wasFolder = this._isFolder;
      this._isFolder = this._children.length > 0;
      if (wasFolder !== this._isFolder) {
        this.render();
      }
    }
  }
}

export class EntityTree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            width:256px;
            display: block;
            font-family: Roboto Mono, Source Code Pro, Menlo, Courier, monospace;
            font-size: 11px;
            font-weight: 500;
            padding: 5px;
            color: hsl(230, 7%, 75%);
            background: hsl(230, 7%, 17%);
            border-radius: 6px;
            margin-bottom: 4px;
            max-height: 50vh;
            overflow:auto;
          }
        </style>
        <slot></slot>
      `;
    }
  }

  sync(root: Entity) {
    const rootItem = new EntityTreeItem(root.id, 'Scene', false);

    this.appendChild(rootItem);

    function resolveTreeItemById(parent: EntityTreeItem, id: string) {
      return parent.items.find((item) => item.id === id);
    }

    function onEntityAdded(child: Entity, treeItem: EntityTreeItem) {
      let childTreeItem = resolveTreeItemById(treeItem, child.id);
      if (!childTreeItem) {
        childTreeItem = new EntityTreeItem(child.path, child.id);
        treeItem.addItem(childTreeItem);
      }
      initEntity(child, childTreeItem);
    }
    function onEntityRemoved(child: Entity, treeItem: EntityTreeItem) {
      const childTreeItem = resolveTreeItemById(treeItem, child.id);
      if (!childTreeItem) {
        return;
      }
      treeItem.removeItem(childTreeItem);
    }

    function initEntity(entity: Entity, treeItem: EntityTreeItem) {
      entity.on('entity-added', ({ entity }) => onEntityAdded(entity, treeItem));
      entity.on('entity-removed', ({ entity }) => onEntityRemoved(entity, treeItem));
      for (const child of entity.entities) {
        onEntityAdded(child, treeItem);
      }
    }

    initEntity(root, rootItem);
  }
}

customElements.define('entity-tree', EntityTree);
customElements.define('entity-tree-item', EntityTreeItem);

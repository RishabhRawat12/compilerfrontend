import { fsStore } from "../store/fsStore.js";
import { uiStore } from "../store/uiStore.js";
import { renderIcons } from "../lib/utils.js";
import { Component } from "../lib/system.js";
import { FsActionDialog } from "./fsActionDialog.js";

export class FileExplorer extends Component {
  constructor(container) {
    super(container, fsStore);
    this.dialog = new FsActionDialog();
    this.mount();
    // initial fetch
    fsStore.refresh();
  }

  render() {
    const { tree, loading, activeFileId } = fsStore.getState();
    const { explorerCollapsed } = uiStore.getState();

    if (explorerCollapsed) {
      this.container.innerHTML = "";
      return;
    }

    this.container.innerHTML = `
      <aside class="flex flex-col h-full bg-surface-0 select-none">
        <div class="h-10 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <span class="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Explorer</span>
          <div class="flex items-center gap-2">
            <button class="btn-icon size-6 text-muted-foreground hover:text-white transition-colors" id="new-folder-btn" title="New Folder">
              <i data-lucide="folder-plus" class="size-3.5"></i>
            </button>
            <button class="btn-icon size-6 text-muted-foreground hover:text-white transition-colors" id="new-file-btn" title="New File">
              <i data-lucide="file-plus" class="size-3.5"></i>
            </button>
          </div>
        </div>

        <div id="file-tree" class="flex-1 overflow-y-auto py-3 scrollbar-none">
          ${loading && !tree.length ? '<div class="px-4 py-2 text-xs text-muted-foreground">Loading…</div>' : this.renderTree(tree, activeFileId)}
        </div>
      </aside>
    `;
  }

  renderTree(nodes, activeId, depth = 0) {
    if (!nodes || nodes.length === 0) {
      if (depth === 0) return '<div class="px-4 py-2 text-[11px] text-muted-foreground italic">No files found.</div>';
      return '';
    }

    return nodes.map(node => {
      const isActive = node.id === activeId;
      const isFolder = node.type === "folder";
      const icon = isFolder ? "folder" : "file-text";
      const paddingLeft = depth * 16 + 12;

      return `
        <div class="tree-node group flex items-center h-9 px-3 cursor-pointer transition-all duration-200 ${isActive ? 'bg-[#1a1d35] text-primary font-medium' : 'text-foreground/70 hover:bg-white/5'}" 
             data-id="${node.id}" data-type="${node.type}" style="padding-left: ${paddingLeft}px">
          <i data-lucide="${icon}" class="size-4 mr-3 ${isActive ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground/80'}"></i>
          <span class="text-[13px] truncate">${node.name}</span>
        </div>
        ${node.children ? this.renderTree(node.children, activeId, depth + 1) : ''}
      `;
    }).join("");
  }

  afterRender() {
    super.afterRender();
    this.bindEvents();
    renderIcons(this.container);
  }


  bindEvents() {
    const tree = this.container.querySelector("#file-tree");
    if (!tree) return;

    tree.onclick = (e) => {
      const node = e.target.closest(".tree-node");
      if (!node) return;
      const id = node.dataset.id;
      const type = node.dataset.type;
      if (type === "file") fsStore.peekFile(id);
    };

    const newBtn = this.container.querySelector("#new-file-btn");
    if (newBtn) {
      newBtn.onclick = () => this.dialog.show('file');
    }

    const folderBtn = this.container.querySelector("#new-folder-btn");
    if (folderBtn) {
      folderBtn.onclick = () => this.dialog.show('folder');
    }
  }
}

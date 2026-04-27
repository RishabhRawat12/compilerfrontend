import { fsStore } from "../store/fsStore.js";
import { uiStore } from "../store/uiStore.js";
import { renderIcons } from "../lib/utils.js";
import { Component } from "../lib/system.js";

export class FileExplorer extends Component {
  constructor(container) {
    super(container, fsStore);
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
        <div class="h-9 px-3 flex items-center justify-between border-b border-white/5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Explorer</span>
          <div class="flex items-center gap-1">
            <button class="btn-ghost size-5 p-0" id="refresh-fs-btn" title="Refresh">
              <i data-lucide="rotate-cw" class="size-3"></i>
            </button>
            <button class="btn-ghost size-5 p-0" id="new-file-btn" title="New File">
              <i data-lucide="file-plus" class="size-3"></i>
            </button>
          </div>
        </div>

        <div id="file-tree" class="flex-1 overflow-y-auto py-2 scrollbar-none">
          ${loading && !tree.length ? '<div class="px-3 py-2 text-xs text-muted-foreground">Loading…</div>' : this.renderTree(tree, activeFileId)}
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
      const paddingLeft = depth * 12 + 12;

      return `
        <div class="tree-node group flex items-center h-7 px-2 cursor-pointer hover:bg-surface-2/60 transition-colors ${isActive ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}" 
             data-id="${node.id}" data-type="${node.type}" style="padding-left: ${paddingLeft}px">
          <i data-lucide="${icon}" class="size-3.5 mr-2 ${isFolder ? 'text-primary/70' : 'text-muted-foreground/50'}"></i>
          <span class="text-xs truncate">${node.name}</span>
        </div>
        ${node.children ? this.renderTree(node.children, activeId, depth + 1) : ''}
      `;
    }).join("");
  }

  afterRender() {
    super.afterRender();
    this.bindEvents();
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
      newBtn.onclick = () => {
        const name = prompt("Enter file name:");
        if (name) fsStore.createFile(name, null);
      };
    }

    const refreshBtn = this.container.querySelector("#refresh-fs-btn");
    if (refreshBtn) {
      refreshBtn.onclick = () => fsStore.refresh();
    }
  }
}

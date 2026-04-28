import { fsStore } from "../store/fsStore.js";
import { uiStore } from "../store/uiStore.js";
import { renderIcons } from "../lib/utils.js";
import { Component } from "../lib/system.js";
import { FsActionDialog } from "./fsActionDialog.js";
import { getFileIcon } from "../lib/fileIcons.js";

export class FileExplorer extends Component {
  constructor(container) {
    super(container, fsStore);
    this.dialog = new FsActionDialog();
    this.collapsedFolders = new Set();
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
        <div class="h-10 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
          <span class="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Explorer</span>
          <div class="flex items-center gap-1">
            <button class="btn-icon size-6 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded transition-colors" id="new-file-btn" title="New File">
              <i data-lucide="file-plus" class="size-3.5"></i>
            </button>
            <button class="btn-icon size-6 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded transition-colors" id="new-folder-btn" title="New Folder">
              <i data-lucide="folder-plus" class="size-3.5"></i>
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
      const isCollapsed = this.collapsedFolders.has(node.id);
      
      let iconName = "file";
      let iconColorClass = "text-muted-foreground";
      let textWeight = "font-normal";

      if (isFolder) {
        iconName = isCollapsed ? "folder" : "folder-open";
        iconColorClass = "text-muted-foreground/80";
        textWeight = "font-semibold";
      } else {
        const fileIconData = getFileIcon(node.name);
        iconName = fileIconData.icon;
        iconColorClass = isActive ? "text-primary" : fileIconData.colorClass;
      }

      const paddingLeft = depth * 16 + 16;
      const activeBg = isActive ? "bg-primary/15" : "hover:bg-white/5";
      const activeBorder = isActive ? "border-primary" : "border-transparent";
      const activeText = isActive ? "text-foreground font-medium" : "text-muted-foreground/90 group-hover:text-foreground";

      let html = `
        <div class="tree-node group flex items-center h-8 cursor-pointer transition-colors border-l-2 ${activeBorder} ${activeBg}" 
             data-id="${node.id}" data-type="${node.type}" style="padding-left: ${paddingLeft}px">
          <i data-lucide="${iconName}" class="size-4 mr-2.5 shrink-0 transition-colors ${iconColorClass}"></i>
          <span class="text-[13px] tracking-tight truncate ${textWeight} ${activeText}">${node.name}</span>
        </div>
      `;

      if (isFolder && !isCollapsed && node.children) {
        html += this.renderTree(node.children, activeId, depth + 1);
      }

      return html;
    }).join("");
  }

  afterRender() {
    super.afterRender();
    this.bindEvents();
    renderIcons(this.container);
  }

  bindEvents() {
    const treeEl = this.container.querySelector("#file-tree");
    if (!treeEl) return;

    treeEl.onclick = (e) => {
      const node = e.target.closest(".tree-node");
      if (!node) return;
      
      const id = node.dataset.id;
      const type = node.dataset.type;

      if (type === "file") {
        fsStore.peekFile(id);
      } else if (type === "folder") {
        // Toggle local state
        if (this.collapsedFolders.has(id)) {
          this.collapsedFolders.delete(id);
        } else {
          this.collapsedFolders.add(id);
        }
        
        // Update ONLY the tree contents to preserve the wrapper and its events
        const { tree, activeFileId } = fsStore.getState();
        treeEl.innerHTML = this.renderTree(tree, activeFileId);
        
        // Re-initialize icons for the newly injected HTML
        renderIcons(treeEl);
      }
    };

    const newBtn = this.container.querySelector("#new-file-btn");
    if (newBtn) newBtn.onclick = () => this.dialog.show('file');

    const folderBtn = this.container.querySelector("#new-folder-btn");
    if (folderBtn) folderBtn.onclick = () => this.dialog.show('folder');
  }
}
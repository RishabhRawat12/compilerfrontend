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

        <!-- HEADER -->
        <div class="h-11 px-3 flex items-center justify-between border-b border-border/50 shrink-0">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Explorer
          </span>

          <div class="flex items-center gap-1">
            <button class="btn-icon size-7 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-md transition-all" id="new-file-btn" title="New File">
              <i data-lucide="file-plus" class="size-4"></i>
            </button>
            <button class="btn-icon size-7 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-md transition-all" id="new-folder-btn" title="New Folder">
              <i data-lucide="folder-plus" class="size-4"></i>
            </button>
          </div>
        </div>

        <!-- TREE -->
        <div id="file-tree" class="flex-1 overflow-y-auto py-2">
          ${loading && !tree.length
            ? '<div class="px-4 py-2 text-xs text-muted-foreground">Loading…</div>'
            : this.renderTree(tree, activeFileId)}
        </div>

      </aside>
    `;
  }

  renderTree(nodes, activeId, depth = 0) {
    if (!nodes || nodes.length === 0) {
      if (depth === 0) {
        return `<div class="px-4 py-2 text-[12px] text-muted-foreground italic">No files found.</div>`;
      }
      return "";
    }

    return nodes.map(node => {
      const isActive = node.id === activeId;
      const isFolder = node.type === "folder";
      const isCollapsed = this.collapsedFolders.has(node.id);

      let iconName = "file";
      let iconColor = "text-muted-foreground";
      let textWeight = "font-normal";

      if (isFolder) {
        iconName = isCollapsed ? "folder" : "folder-open";
        iconColor = "text-muted-foreground/80";
        textWeight = "font-medium";
      } else {
        const fileIconData = getFileIcon(node.name);
        iconName = fileIconData.icon;
        iconColor = isActive ? "text-primary" : fileIconData.colorClass;
      }

      // 🔥 Better indentation
      const paddingLeft = depth * 18 + 14;

      // 🔥 Stronger states
      const base = "tree-node flex items-center h-9 rounded-md cursor-pointer transition-all border-l-2";
      const state = isActive
        ? "bg-primary/15 border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground";

      let html = `
        <div 
          class="${base} ${state}" 
          data-id="${node.id}" 
          data-type="${node.type}" 
          style="padding-left: ${paddingLeft}px"
        >
          <i data-lucide="${iconName}" class="size-4 mr-2 shrink-0 ${iconColor}"></i>
          <span class="text-[13.5px] truncate ${textWeight}">
            ${node.name}
          </span>
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
        if (this.collapsedFolders.has(id)) {
          this.collapsedFolders.delete(id);
        } else {
          this.collapsedFolders.add(id);
        }

        const { tree, activeFileId } = fsStore.getState();
        treeEl.innerHTML = this.renderTree(tree, activeFileId);
        renderIcons(treeEl);
      }
    };

    const newBtn = this.container.querySelector("#new-file-btn");
    if (newBtn) newBtn.onclick = () => this.dialog.show("file");

    const folderBtn = this.container.querySelector("#new-folder-btn");
    if (folderBtn) folderBtn.onclick = () => this.dialog.show("folder");
  }
}
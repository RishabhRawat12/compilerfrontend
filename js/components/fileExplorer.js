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
    this.searchQuery = "";
    this.contextMenu = null;
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
            <button class="btn-icon size-6 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded transition-colors" id="new-file-btn" title="New File (Ctrl+Alt+N)">
              <i data-lucide="file-plus" class="size-3.5"></i>
            </button>
            <button class="btn-icon size-6 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded transition-colors" id="new-folder-btn" title="New Folder">
              <i data-lucide="folder-plus" class="size-3.5"></i>
            </button>
            <button class="btn-icon size-6 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded transition-colors" id="search-toggle-btn" title="Search files (Ctrl+P)">
              <i data-lucide="search" class="size-3.5"></i>
            </button>
          </div>
        </div>

        <div class="px-2 py-2 shrink-0 hidden" id="file-search-container">
          <input type="text" id="file-search" placeholder="Search files..." class="w-full h-7 px-2 bg-surface-2 border border-border/50 rounded text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50">
        </div>

        <div id="file-tree" class="flex-1 overflow-y-auto py-3 scrollbar-none">
          ${loading && !tree.length ? '<div class="px-4 py-2 text-xs text-muted-foreground">Loading…</div>' : this.renderTree(tree, activeFileId)}
        </div>

        <div id="file-context-menu" class="hidden fixed bg-popover border border-border rounded-md shadow-lg z-50 py-1 min-w-48">
          <!-- Context menu items injected here -->
        </div>
      </aside>
    `;
  }

  renderTree(nodes, activeId, depth = 0) {
    if (!nodes || nodes.length === 0) {
      if (depth === 0) return '<div class="px-4 py-2 text-[11px] text-muted-foreground italic">No files found.</div>';
      return '';
    }

    // Filter by search query if present
    const filteredNodes = this.searchQuery ? nodes.filter(n => n.name.toLowerCase().includes(this.searchQuery.toLowerCase())) : nodes;

    return filteredNodes.map(node => {
      const isActive = node.id === activeId;
      const isFolder = node.type === "folder";
      const isCollapsed = this.collapsedFolders.has(node.id);
      const isFavorite = uiStore.getState().favorites.includes(node.id);
      
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
          ${isFolder ? `<button class="mr-1 p-0 hover:bg-surface-2 rounded flex items-center tree-toggle" data-id="${node.id}"><i data-lucide="chevron-right" class="size-4 transition-transform ${!isCollapsed ? 'rotate-90' : ''}"></i></button>` : '<div class="mr-1 w-4"></div>'}
          <i data-lucide="${iconName}" class="size-4 mr-2.5 shrink-0 transition-colors ${iconColorClass}"></i>
          <span class="text-[13px] tracking-tight truncate flex-1 ${textWeight} ${activeText}">${node.name}</span>
          ${isFavorite ? '<i data-lucide="star" class="size-3.5 text-warning fill-warning ml-1" title="Favorite"></i>' : ''}
          <button class="file-context-trigger opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-2 rounded" data-id="${node.id}" title="More options">
            <i data-lucide="more-horizontal" class="size-3.5"></i>
          </button>
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
    const searchBtn = this.container.querySelector("#search-toggle-btn");
    const searchContainer = this.container.querySelector("#file-search-container");
    const searchInput = this.container.querySelector("#file-search");
    const contextMenu = this.container.querySelector("#file-context-menu");

    if (!treeEl) return;

    // Search toggle
    if (searchBtn) {
      searchBtn.onclick = (e) => {
        e.stopPropagation();
        searchContainer.classList.toggle("hidden");
        if (!searchContainer.classList.contains("hidden")) {
          searchInput.focus();
        }
      };
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        const { tree, activeFileId } = fsStore.getState();
        treeEl.innerHTML = this.renderTree(tree, activeFileId);
        renderIcons(treeEl);
      });
    }

    // Tree node click
    treeEl.addEventListener("click", (e) => {
      // Toggle folder
      const toggle = e.target.closest(".tree-toggle");
      if (toggle) {
        e.stopPropagation();
        const id = toggle.dataset.id;
        if (this.collapsedFolders.has(id)) {
          this.collapsedFolders.delete(id);
        } else {
          this.collapsedFolders.add(id);
        }
        const { tree, activeFileId } = fsStore.getState();
        treeEl.innerHTML = this.renderTree(tree, activeFileId);
        renderIcons(treeEl);
        return;
      }

      // Context menu trigger
      const contextTrigger = e.target.closest(".file-context-trigger");
      if (contextTrigger) {
        e.stopPropagation();
        this.showContextMenu(contextTrigger.dataset.id, e);
        return;
      }

      // Select file/folder
      const node = e.target.closest(".tree-node");
      if (node) {
        const id = node.dataset.id;
        const type = node.dataset.type;

        if (type === "file") {
          fsStore.peekFile(id);
        }
      }
    });

    // Create buttons
    const newBtn = this.container.querySelector("#new-file-btn");
    if (newBtn) newBtn.onclick = () => this.dialog.show('file');

    const folderBtn = this.container.querySelector("#new-folder-btn");
    if (folderBtn) folderBtn.onclick = () => this.dialog.show('folder');

    // Close context menu on click outside
    document.addEventListener("click", (e) => {
      if (!contextMenu.contains(e.target) && !e.target.closest(".file-context-trigger")) {
        contextMenu.classList.add("hidden");
      }
    });
  }

  showContextMenu(nodeId, event) {
    const contextMenu = this.container.querySelector("#file-context-menu");
    const isFavorite = uiStore.getState().favorites.includes(nodeId);
    const { files } = fsStore.getState();
    const node = files.find(f => f.id === nodeId);
    
    if (!node) return;

    contextMenu.innerHTML = `
      <button data-action="open" data-id="${nodeId}" class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-2 flex items-center gap-2">
        <i data-lucide="file-text" class="size-3.5"></i> Open
      </button>
      <button data-action="favorite" data-id="${nodeId}" class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-2 flex items-center gap-2">
        <i data-lucide="star" class="size-3.5 ${isFavorite ? 'fill-warning' : ''}"></i> ${isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
      </button>
      <button data-action="rename" data-id="${nodeId}" class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-2 flex items-center gap-2">
        <i data-lucide="edit-2" class="size-3.5"></i> Rename
      </button>
      <button data-action="copy-path" data-id="${nodeId}" class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-2 flex items-center gap-2">
        <i data-lucide="copy" class="size-3.5"></i> Copy Path
      </button>
      <div class="h-px bg-border my-1"></div>
      <button data-action="delete" data-id="${nodeId}" class="w-full text-left px-3 py-1.5 text-xs hover:bg-destructive/15 text-destructive flex items-center gap-2">
        <i data-lucide="trash-2" class="size-3.5"></i> Delete
      </button>
    `;

    renderIcons(contextMenu);

    contextMenu.style.left = event.pageX + "px";
    contextMenu.style.top = event.pageY + "px";
    contextMenu.classList.remove("hidden");

    // Handle menu actions
    contextMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      switch (action) {
        case "open":
          fsStore.peekFile(id);
          break;
        case "favorite":
          if (isFavorite) {
            uiStore.removeFavorite(id);
          } else {
            uiStore.addFavorite(id);
          }
          this.update();
          break;
        case "rename":
          this.dialog.show('rename', id);
          break;
        case "copy-path":
          const file = files.find(f => f.id === id);
          if (file) {
            navigator.clipboard.writeText(file.name);
          }
          break;
        case "delete":
          if (confirm(`Delete ${node.name}?`)) {
            fsStore.deleteFile(id);
          }
          break;
      }

      contextMenu.classList.add("hidden");
    });
  }
}

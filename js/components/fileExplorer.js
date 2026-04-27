import { fsStore } from "../store/fsStore.js";
import { uiStore } from "../store/uiStore.js";
import { renderIcons } from "../lib/utils.js";
import { Component } from "../lib/system.js";

export class FileExplorer extends Component {
  constructor(container) {
    super(container, fsStore);
    this.mount();
  }

  render() {
    const { tree, loading, activeFileId } = fsStore.getState();
    const { explorerCollapsed } = uiStore.getState();

    if (explorerCollapsed) return;

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
          ${loading ? '<div class="px-4 py-2 text-xs text-muted-foreground">Loading…</div>' : this.renderTree(tree, activeFileId)}
        </div>
      </aside>
    `;
    }

    if (!this.state.tree.length) {
      treeContainer.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center pb-12">
          <p class="text-sm text-subtle-foreground mb-4">No files yet</p>
          <button class="flex items-center gap-2 px-6 py-2 bg-primary/10 border border-primary/30 rounded-full text-foreground hover:bg-primary/20 transition-all group" id="btn-empty-new-file">
            <i data-lucide="file-plus" class="size-4 group-hover:scale-110 transition-transform stroke-2"></i>
            <span class="text-sm font-semibold tracking-wide">New file</span>
          </button>
        </div>
      `;
      renderIcons(treeContainer);
      const emptyBtn = treeContainer.querySelector("#btn-empty-new-file");
      if (emptyBtn) {
        emptyBtn.addEventListener("click", () => this.showPendingInput('file', null));
      }
      return;
    }

    // Build DOM
    const ul = document.createElement("ul");
    this.state.tree.forEach(node => {
      ul.appendChild(this.createNodeEl(node, 0));
    });

    treeContainer.innerHTML = "";
    treeContainer.appendChild(ul);
    
    renderIcons(treeContainer);

    if (this.renamingNodeId) {
      const input = treeContainer.querySelector(`#rename-${this.renamingNodeId}`);
      if (input) input.focus();
    }
  }

  createNodeEl(node, depth) {
    const li = document.createElement("li");
    const isFolder = node.type === "folder";
    const isActive = node.type === "file" && this.state.activeFileId === node.id;
    const isOpen = this.openFolders.has(node.id);
    const isRenaming = this.renamingNodeId === node.id;

    // Outer div for exactly one row
    const row = document.createElement("div");
    row.className = `group relative flex items-center gap-1.5 pr-1.5 py-[3px] cursor-pointer hover:bg-surface-2 transition-colors ${isActive ? "bg-surface-2 text-foreground" : "text-muted-foreground"}`;
    row.style.paddingLeft = `${depth * 10 + 6}px`;
    if (isActive) {
      row.innerHTML += `<div class="absolute left-0 top-0 bottom-0 w-[2px] bg-primary"></div>`;
      row.classList.remove("text-muted-foreground");
    }

    // Icon
    let iconHtml = "";
    if (isFolder) {
      iconHtml = `<i data-lucide="chevron-right" class="size-3 shrink-0 ${isOpen ? 'rotate-90' : ''} transition-transform"></i>
                  <i data-lucide="${isOpen ? 'folder-open' : 'folder'}" class="size-3.5 text-amber-300/90 shrink-0"></i>`;
    } else {
      const fileIcon = getFileIcon(node.name);
      iconHtml = `<div class="size-3 shrink-0"></div><i data-lucide="${fileIcon.icon}" class="size-3.5 shrink-0 ${fileIcon.colorClass}"></i>`;
    }

    // Label or Input
    let labelHtml = "";
    if (isRenaming) {
      labelHtml = `<input type="text" value="${node.name}" class="h-5 px-1 py-0 text-xs font-mono bg-surface-3 border border-primary/50 text-foreground w-full rounded outline-none" id="rename-${node.id}">`;
    } else {
      labelHtml = `<span class="truncate flex-1 font-mono text-[12px] leading-5 ${isActive ? 'text-foreground' : ''}">${node.name}</span>`;
    }

    row.innerHTML += iconHtml + labelHtml;

    // Events
    row.addEventListener("click", () => {
      if (isRenaming) return;
      if (isFolder) {
        if (this.openFolders.has(node.id)) this.openFolders.delete(node.id);
        else this.openFolders.add(node.id);
        // We only re-render the tree. For hyper-optimizations we could just toggle children visually
        this.renderTree();
      } else {
        fsStore.peekFile(node.id);
      }
    });

    row.addEventListener("dblclick", () => {
      if (isRenaming) return;
      if (!isFolder) {
        fsStore.pinFile(node.id);
      }
    });

    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showContextMenu(e, node);
    });

    // Rename logic handling
    if (isRenaming) {
      const input = row.querySelector(`#rename-${node.id}`);
      if (input) {
        const commitRename = async () => {
          const val = input.value.trim();
          if (val && val !== node.name) {
            await fsStore.rename(node.type, node.id, val);
          }
          this.renamingNodeId = null;
          this.renderTree();
        };
        input.addEventListener("blur", commitRename);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") commitRename();
          if (e.key === "Escape") {
            this.renamingNodeId = null;
            this.renderTree();
          }
        });
      }
    }

    li.appendChild(row);

    // Render children
    if (isFolder && isOpen && node.children.length > 0) {
      const childrenUl = document.createElement("ul");
      childrenUl.className = "border-l border-border/60 ml-3";
      node.children.forEach(c => childrenUl.appendChild(this.createNodeEl(c, depth + 1)));
      li.appendChild(childrenUl);
    }

    return li;
  }

  showPendingInput(type, parentId) {
    this.pendingNode = { type, parentId };
    const pendingRow = this.container.querySelector("#explorer-pending");
    const input = pendingRow.querySelector("input");
    pendingRow.classList.remove("hidden");
    pendingRow.classList.add("flex");
    
    // Set icon based on type
    const lucideEl = pendingRow.querySelector("i");
    lucideEl.setAttribute("data-lucide", type === 'folder' ? 'folder' : 'file');
    renderIcons(pendingRow);

    input.value = "";
    input.placeholder = type === 'folder' ? "folder_name" : "main.c";
    input.focus();

    const commitCreate = async () => {
      const val = input.value.trim();
      if (val) {
        if (type === 'file') await fsStore.createFile(val, parentId);
        else await fsStore.createFolder(val, parentId);
        
        if (parentId) this.openFolders.add(parentId); // auto-expand parent
      }
      this.pendingNode = null;
      pendingRow.classList.add("hidden");
      pendingRow.classList.remove("flex");
    };

    const handleBlur = () => commitCreate();
    input.addEventListener("blur", handleBlur);
    input.addEventListener("keydown", function handler(e) {
      if (e.key === "Enter") {
        input.removeEventListener("blur", handleBlur);
        commitCreate();
        input.removeEventListener("keydown", handler);
      }
      if (e.key === "Escape") {
        input.removeEventListener("blur", handleBlur);
        this.pendingNode = null;
        pendingRow.classList.add("hidden");
        pendingRow.classList.remove("flex");
        input.removeEventListener("keydown", handler);
      }
    });
  }

  showContextMenu(e, node) {
    if (this._closeContextMenu) {
      this._closeContextMenu();
    }

    const ctx = this.container.querySelector("#explorer-context-menu");
    ctx.style.left = `${e.clientX}px`;
    ctx.style.top = `${e.clientY}px`;
    ctx.classList.remove("hidden");

    // adjust options based on type
    const btnFile = ctx.querySelector("[data-ctx='new-file']");
    const btnFolder = ctx.querySelector("[data-ctx='new-folder']");
    
    if (node.type === "folder") {
      btnFile.style.display = "block";
      btnFolder.style.display = "block";
    } else {
      // Cannot create inside a file
      btnFile.style.display = "none";
      btnFolder.style.display = "none";
    }

    const unbind = () => {
      ctx.classList.add("hidden");
      document.removeEventListener("click", onClickOutside);
      this._closeContextMenu = null;
    };
    this._closeContextMenu = unbind;

    const onClickOutside = (ev) => {
      if (!ctx.contains(ev.target)) unbind();
    };

    // re-bind click actions
    ctx.onclick = async (ev) => {
      const action = ev.target.getAttribute("data-ctx");
      if (!action) return;
      
      unbind();
      
      if (action === "new-file") this.showPendingInput('file', node.id);
      if (action === "new-folder") this.showPendingInput('folder', node.id);
      if (action === "rename") {
        this.renamingNodeId = node.id;
        this.renderTree();
      }
      if (action === "delete") {
        if (confirm(`Delete ${node.name}?`)) {
          await fsStore.remove(node.type, node.id);
        }
      }
    };

    setTimeout(() => {
      document.addEventListener("click", onClickOutside);
    }, 0);
  }

  bindEvents() {
    const actNewFile = this.container.querySelector("[data-action='new-file']");
    const actNewFolder = this.container.querySelector("[data-action='new-folder']");

    actNewFile.addEventListener("click", () => this.showPendingInput('file', null));
    actNewFolder.addEventListener("click", () => this.showPendingInput('folder', null));
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    this.container.innerHTML = "";
  }
}

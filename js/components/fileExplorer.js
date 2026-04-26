import { fsStore } from "../store/fsStore.js";
import { getFileIcon } from "../lib/fileIcons.js";
import { toast } from "../lib/toast.js";

export class FileExplorer {
  constructor(container) {
    this.container = container;
    this.unsubscribe = null;
    this.state = { tree: [], activeFileId: null };
    this.openFolders = new Set(); // Track expanded folders
    
    // UI state
    this.pendingNode = null; // { type, parentId }
    this.renamingNodeId = null;

    this.render();
    this.bindEvents();
    
    // Subscribe to fsStore
    this.unsubscribe = fsStore.subscribe(s => {
      this.state = s;
      this.renderTree();
    });

    // initial fetch
    fsStore.refresh();
  }

  render() {
    this.container.innerHTML = `
      <div class="h-full flex flex-col bg-surface-1 border border-border rounded-lg overflow-hidden select-none text-sm">
        <div class="flex items-center justify-between px-3 h-9 border-b border-border bg-surface-1 shrink-0">
          <span class="text-xs-tight font-semibold uppercase tracking-[0.12em] text-muted-foreground">Explorer</span>
          <div class="flex items-center gap-0.5" id="explorer-actions">
            <button class="size-6 text-muted-foreground hover:text-foreground flex items-center justify-center rounded hover:bg-surface-2" data-action="new-file" title="New file">
              <i data-lucide="file-plus" class="size-3.5"></i>
            </button>
            <button class="size-6 text-muted-foreground hover:text-foreground flex items-center justify-center rounded hover:bg-surface-2" data-action="new-folder" title="New folder">
              <i data-lucide="folder-plus" class="size-3.5"></i>
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-auto py-1 min-h-0" id="explorer-tree">
          <!-- Tree injected here -->
        </div>

        <!-- Pending Input Row (hidden) -->
        <div id="explorer-pending" class="hidden px-2 py-1 items-center gap-2 text-xs">
          <i data-lucide="file" class="size-3.5 shrink-0 text-muted-foreground"></i>
          <input type="text" id="pending-input" class="w-full bg-surface-3 border border-primary/50 text-foreground rounded px-1 outline-none font-mono">
        </div>
        
        <!-- Context Menu modal -->
        <div id="explorer-context-menu" class="hidden fixed bg-popover text-popover-foreground border border-border rounded-md shadow-md py-1 z-50 text-xs w-32">
          <button class="w-full text-left px-3 py-1.5 hover:bg-surface-2" data-ctx="new-file">New file</button>
          <button class="w-full text-left px-3 py-1.5 hover:bg-surface-2" data-ctx="new-folder">New folder</button>
          <div class="h-px bg-border my-1"></div>
          <button class="w-full text-left px-3 py-1.5 hover:bg-surface-2" data-ctx="rename">Rename</button>
          <div class="h-px bg-border my-1"></div>
          <button class="w-full text-left px-3 py-1.5 hover:bg-destructive/20 text-destructive focus:text-destructive" data-ctx="delete">Delete</button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ root: this.container });
  }

  renderTree() {
    const treeContainer = this.container.querySelector("#explorer-tree");
    
    if (this.state.loading && !this.state.tree.length) {
      treeContainer.innerHTML = `<div class="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground"><i data-lucide="loader-2" class="size-3.5 animate-spin"></i> Loading…</div>`;
      if (window.lucide) lucide.createIcons({ root: treeContainer });
      return;
    }

    if (!this.state.tree.length) {
      treeContainer.innerHTML = `
        <div class="px-3 py-8 text-center">
          <p class="text-xs text-muted-foreground mb-3">No files yet</p>
          <button class="btn btn-sm text-primary border border-primary/30" id="btn-empty-new-file">
            <i data-lucide="file-plus" class="size-3.5 mr-1.5"></i> New file
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: treeContainer });
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
    
    // Explicitly scope lucide insertion for performance
    if (window.lucide) lucide.createIcons({ root: treeContainer });
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
      setTimeout(() => {
        const input = row.querySelector(`#rename-${node.id}`);
        if (input) {
          input.focus();
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
      }, 0);
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
    if (window.lucide) lucide.createIcons({ root: pendingRow });

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
    };

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

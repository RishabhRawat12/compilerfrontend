import { uiStore } from "../store/uiStore.js";
import { authStore } from "../store/authStore.js";
import { fsStore } from "../store/fsStore.js";
import { cn, renderIcons } from "../lib/utils.js";
import { SettingsDialog } from "./settingsDialog.js";
import { Component } from "../lib/system.js";

export class Header extends Component {
  constructor(container) {
    super(container, uiStore);
    this.settingsDialog = new SettingsDialog();
    this.unsubscribeAuth = authStore.subscribe(() => this.update());
    this.unsubscribeFs = fsStore.subscribe(() => this.updateBreadcrumbs());
    this.mount();
  }

  render() {
    const { explorerCollapsed, layoutDir, fontSize } = uiStore.getState();
    const { user } = authStore.getState();
    const { activeFileId, files } = fsStore.getState();
    const activeFile = files.find(f => f.id === activeFileId);
    const username = user?.username || "Account";
    const layoutIcon = layoutDir === "horizontal" ? "columns-2" : "rows-2";
    const menuIcon = explorerCollapsed ? "panel-left-close" : "panel-left";

    this.container.innerHTML = `
      <header class="h-9 flex items-center justify-between px-2.5 border-b border-border bg-surface-0 shrink-0 select-none">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <button id="header-menu-btn" class="btn-icon h-7 w-7" aria-label="Toggle explorer" title="Toggle Explorer (Ctrl+B)">
              <i data-lucide="${menuIcon}" class="size-4 stroke-[1.5]"></i>
            </button>
            <button id="header-layout-btn" class="btn-icon h-7 w-7" aria-label="Toggle layout" title="Toggle Layout">
              <i data-lucide="${layoutIcon}" class="size-4 stroke-[1.5]"></i>
            </button>
          </div>
          
          <div class="flex items-center gap-2 ml-1.5 pointer-events-none">
            <div class="size-6 rounded-md flex items-center justify-center shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary-glow">
              <i data-lucide="zap" class="size-3.5 text-white fill-white stroke-[2.5]"></i>
            </div>
            <span class="text-[13px] font-bold tracking-tight text-white/95">CompilerHub</span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-1 max-w-md mx-4">
          <i data-lucide="chevron-right" class="size-3.5 text-muted-foreground/40 shrink-0"></i>
          <div id="header-breadcrumbs" class="text-[11px] text-muted-foreground font-mono truncate flex items-center gap-1">
            <span>workspace</span>
            ${activeFile ? `<i data-lucide="chevron-right" class="size-3 text-muted-foreground/40"></i><span class="text-white/80">${activeFile.name}</span>` : ''}
          </div>
        </div>

        <button id="header-search-btn" class="hidden sm:flex items-center gap-2 h-6 px-3 rounded-md bg-background/60 border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" title="Search (Ctrl+K)">
          <i data-lucide="search" class="size-3"></i>
          <span>Search…</span>
          <kbd class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border/50 ml-1">⌘K</kbd>
        </button>

        <div class="flex items-center gap-1 flex-shrink-0">
          <div class="relative">
            <button id="header-user-btn" class="btn-ghost h-6 px-2 text-[11px] gap-1" aria-label="User menu" aria-haspopup="true">
              <i data-lucide="user" class="size-3.5"></i>
              <span class="hidden sm:inline">${username}</span>
              <i data-lucide="chevron-down" class="size-3 ml-0.5"></i>
            </button>
            <div id="user-dropdown" class="hidden absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50 py-1" role="menu">
              <button id="show-settings-btn" class="w-full text-left flex items-center px-3 py-1.5 text-xs hover:bg-surface-2 transition-colors" role="menuitem">
                <i data-lucide="sliders-horizontal" class="size-3.5 mr-2"></i> Settings
              </button>
              <button id="show-keyboard-btn" class="w-full text-left flex items-center px-3 py-1.5 text-xs hover:bg-surface-2 transition-colors" role="menuitem">
                <i data-lucide="keyboard" class="size-3.5 mr-2"></i> Keyboard Shortcuts
              </button>
              <div class="h-px bg-border my-1"></div>
              <button id="logout-btn" class="w-full text-left flex items-center px-3 py-1.5 text-xs text-destructive hover:bg-destructive/15 transition-colors" role="menuitem">
                <i data-lucide="log-out" class="size-3.5 mr-2"></i> Log out
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  afterRender() {
    super.afterRender();
    this.bindEvents();
    renderIcons(this.container);
  }

  updateBreadcrumbs() {
    const el = this.container.querySelector("#header-breadcrumbs");
    if (!el) return;
    const { activeFileId, files } = fsStore.getState();
    const activeFile = files.find(f => f.id === activeFileId);
    
    if (activeFile) {
      el.innerHTML = `<span>workspace</span><i data-lucide="chevron-right" class="size-3 text-muted-foreground/40"></i><span class="text-white/80">${activeFile.name}</span>`;
      renderIcons(el);
    } else {
      el.innerHTML = '<span>workspace</span>';
      renderIcons(el);
    }
  }

  bindEvents() {
    const userBtn = this.container.querySelector("#header-user-btn");
    const userDropdown = this.container.querySelector("#user-dropdown");

    this.container.querySelector("#header-menu-btn").onclick = () => uiStore.toggleExplorer();
    this.container.querySelector("#header-layout-btn").onclick = () => uiStore.toggleLayoutDir();
    this.container.querySelector("#header-search-btn").onclick = () => uiStore.setCommandPaletteOpen(true);
    this.container.querySelector("#logout-btn").onclick = () => authStore.logout();
    this.container.querySelector("#show-settings-btn").onclick = () => {
       userDropdown.classList.add("hidden");
       this.settingsDialog.show("editor");
    };
    this.container.querySelector("#show-keyboard-btn").onclick = () => {
       userDropdown.classList.add("hidden");
       this.showKeyboardShortcuts();
    };

    userBtn.onclick = (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    };

    const closeOnOutside = (e) => {
      if (userDropdown && !userDropdown.classList.contains("hidden") && !userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
        userDropdown.classList.add("hidden");
      }
    };
    document.addEventListener("click", closeOnOutside);
    this.cleanupClickOutside = () => document.removeEventListener("click", closeOnOutside);
  }

  showKeyboardShortcuts() {
    const shortcuts = [
      { keys: "Ctrl+K", action: "Open Command Palette" },
      { keys: "Ctrl+S", action: "Save File" },
      { keys: "Ctrl+Enter", action: "Run/Compile" },
      { keys: "Ctrl+B", action: "Toggle File Explorer" },
      { keys: "Ctrl+,", action: "Open Settings" },
      { keys: "Alt+Shift+F", action: "Format Code" },
      { keys: "Ctrl+/", action: "Toggle Comment" },
      { keys: "Alt+Up/Down", action: "Move Line Up/Down" }
    ];

    const html = `
      <div class="overlay">
        <div class="modal-content max-w-md">
          <h2 class="text-lg font-semibold text-foreground mb-4">Keyboard Shortcuts</h2>
          <div class="flex flex-col gap-2 mb-6 max-h-96 overflow-y-auto">
            ${shortcuts.map(s => `
              <div class="flex items-center justify-between p-2 bg-surface-2 rounded text-xs">
                <span class="text-muted-foreground">${s.action}</span>
                <kbd class="font-mono bg-surface-1 px-2 py-1 rounded border border-border">${s.keys}</kbd>
              </div>
            `).join("")}
          </div>
          <div class="flex justify-end">
            <button id="close-shortcuts" class="btn btn-primary px-4 py-2 text-xs">Close</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    renderIcons(container);

    container.querySelector("#close-shortcuts").onclick = () => {
      document.body.removeChild(container);
    };

    container.addEventListener("click", (e) => {
      if (e.target === container.querySelector(".overlay")) {
        document.body.removeChild(container);
      }
    });
  }

  destroy() {
    super.destroy();
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.unsubscribeFs) this.unsubscribeFs();
    if (this.cleanupClickOutside) this.cleanupClickOutside();
  }
}

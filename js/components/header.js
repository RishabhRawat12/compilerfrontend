import { uiStore } from "../store/uiStore.js";
import { authStore } from "../store/authStore.js";
import { cn, renderIcons } from "../lib/utils.js";
import { SettingsDialog } from "./settingsDialog.js";
import { Component } from "../lib/system.js";

export class Header extends Component {
  constructor(container) {
    super(container, uiStore);
    this.settingsDialog = new SettingsDialog();
    this.unsubscribeAuth = authStore.subscribe(() => this.update());
    this.mount();
  }

  render() {
    const { explorerCollapsed, layoutDir, fontSize } = uiStore.getState();
    const { user } = authStore.getState();
    const username = user?.username || "Account";
    const layoutIcon = layoutDir === "horizontal" ? "columns-2" : "rows-2";
    const menuIcon = explorerCollapsed ? "panel-left-close" : "panel-left";

    this.container.innerHTML = `
      <header class="h-9 flex items-center justify-between px-2.5 border-b border-border bg-surface-0 shrink-0 select-none">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <button id="header-menu-btn" class="btn-icon h-7 w-7" aria-label="Toggle explorer">
              <i data-lucide="${menuIcon}" class="size-18 stroke-1_5"></i>
            </button>
            <button id="header-layout-btn" class="btn-icon h-7 w-7" aria-label="Toggle layout">
              <i data-lucide="${layoutIcon}" class="size-18 stroke-1_5"></i>
            </button>
          </div>
          
          <div class="flex items-center gap-2 ml-1.5 pointer-events-none">
            <div class="size-6 rounded-md flex items-center justify-center shadow-lg shadow-primary/20" style="background-image: var(--gradient-primary)">
              <i data-lucide="zap" class="size-3.5 text-white fill-white stroke-2_5"></i>
            </div>
            <span class="text-[13px] font-bold tracking-tight text-white/95">CompilerHub</span>
          </div>
        </div>

        <button id="header-search-btn" class="hidden sm:flex items-center gap-2 h-6 px-2 max-w-md w-72 rounded-md bg-background/60 border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors mx-4">
          <i data-lucide="search" class="size-3"></i>
          <span class="flex-1 text-left">Search files, run commands…</span>
          <kbd class="font-mono text-[10px] px-1 rounded bg-secondary/60 border border-border">Ctrl K</kbd>
        </button>

        <div class="flex items-center gap-1">
          <div class="flex items-center bg-surface-2 rounded-md px-1.5 h-6 mr-2 gap-2">
            <button id="font-dec" class="hover:text-foreground transition-colors p-0 min-w-0" title="Decrease font size">
              <i data-lucide="minus" class="size-3"></i>
            </button>
            <span class="text-[10px] font-mono min-w-[12px] text-center">${fontSize}</span>
            <button id="font-inc" class="hover:text-foreground transition-colors p-0 min-w-0" title="Increase font size">
              <i data-lucide="plus" class="size-3"></i>
            </button>
          </div>

          <div class="relative">
            <button id="header-user-btn" class="btn-ghost h-6 px-2 text-[11px] gap-1">
              <span>${username}</span>
              <i data-lucide="chevron-down" class="size-3 ml-0.5"></i>
            </button>
            <div id="user-dropdown" class="hidden absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50 py-1">
              <button id="show-settings-btn" class="w-full text-left flex items-center px-3 py-1.5 text-xs hover:bg-surface-2">
                <i data-lucide="server" class="size-3.5 mr-2"></i> Backend Settings
              </button>
              <div class="h-px bg-border my-1"></div>
              <button id="logout-btn" class="w-full text-left flex items-center px-3 py-1.5 text-xs text-destructive hover:bg-destructive/15">
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
  }

  bindEvents() {
    const userBtn = this.container.querySelector("#header-user-btn");
    const userDropdown = this.container.querySelector("#user-dropdown");

    this.container.querySelector("#header-menu-btn").onclick = () => uiStore.toggleExplorer();
    this.container.querySelector("#header-layout-btn").onclick = () => uiStore.toggleLayoutDir();
    this.container.querySelector("#header-search-btn").onclick = () => uiStore.setCommandPaletteOpen(true);
    this.container.querySelector("#font-inc").onclick = () => uiStore.fontInc();
    this.container.querySelector("#font-dec").onclick = () => uiStore.fontDec();
    this.container.querySelector("#logout-btn").onclick = () => authStore.logout();
    this.container.querySelector("#show-settings-btn").onclick = () => {
       userDropdown.classList.add("hidden");
       this.settingsDialog.show();
    };

    userBtn.onclick = (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    };

    const closeOnOutside = (e) => {
      if (userDropdown && !userDropdown.classList.contains("hidden") && !userDropdown.contains(e.target)) {
        userDropdown.classList.add("hidden");
      }
    };
    document.addEventListener("click", closeOnOutside);
    this.cleanupClickOutside = () => document.removeEventListener("click", closeOnOutside);
  }

  destroy() {
    super.destroy();
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.cleanupClickOutside) this.cleanupClickOutside();
  }
}

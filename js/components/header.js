import { uiStore } from "../store/uiStore.js";
import { authStore } from "../store/authStore.js";
import { cn } from "../lib/utils.js";

export class Header {
  constructor(container) {
    this.container = container;
    this.unsubscribeUi = null;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <header class="h-9 flex items-center justify-between gap-3 px-2 border-b border-border bg-surface-1 shrink-0 transition-colors">
        <div class="flex items-center gap-1">
          <button id="header-menu-btn" class="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors" aria-label="Toggle explorer">
            <i data-lucide="panel-left" class="size-3.5"></i>
          </button>
          <button id="header-layout-btn" class="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors" aria-label="Toggle layout">
            <i data-lucide="rows-2" id="layout-icon" class="size-3.5"></i>
          </button>
          
          <span class="size-5 rounded flex items-center justify-center bg-gradient-to-br from-primary to-primary-glow ml-1">
            <i data-lucide="zap" class="size-3 text-primary-foreground"></i>
          </span>
          <h1 class="text-xs font-semibold tracking-tight ml-1 text-foreground">CompilerHub</h1>
        </div>

        <button id="header-search-btn" class="hidden sm:flex items-center gap-2 h-6 px-2 max-w-md w-72 rounded-md bg-background/60 border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors mx-4">
          <i data-lucide="search" class="size-3"></i>
          <span class="flex-1 text-left">Search files, run commands…</span>
          <kbd class="font-mono text-[10px] px-1 rounded bg-secondary/60 border border-border">Ctrl K</kbd>
        </button>

        <div class="flex items-center gap-1">
          <div class="relative">
            <button id="header-user-btn" class="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 rounded hover:bg-surface-2 transition-colors">
              <span id="header-username">Account</span>
              <i data-lucide="chevron-down" class="size-3 ml-0.5"></i>
            </button>
            <div id="user-dropdown" class="hidden absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50 py-1">
              <div class="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Appearance</div>
              <div class="px-3 py-1.5 flex items-center justify-between text-xs">
                <span class="flex items-center"><i data-lucide="settings" class="size-3.5 mr-2"></i> Font Size</span>
                <div class="flex items-center gap-2 bg-surface-2 rounded px-1">
                  <button id="font-dec" class="hover:text-primary"><i data-lucide="minus" class="size-3"></i></button>
                  <span id="font-val" class="font-mono text-xs w-4 text-center">14</span>
                  <button id="font-inc" class="hover:text-primary"><i data-lucide="plus" class="size-3"></i></button>
                </div>
              </div>
              <div class="h-px bg-border my-1"></div>
              <button id="logout-btn" class="w-full text-left flex items-center px-3 py-1.5 text-xs text-destructive hover:bg-destructive/15 transition-colors">
                <i data-lucide="log-out" class="size-3.5 mr-2"></i> Log out
              </button>
            </div>
          </div>
        </div>
      </header>
    `;

    if (window.lucide) {
      lucide.createIcons({ root: this.container });
    }
  }

  bindEvents() {
    const menuBtn = this.container.querySelector("#header-menu-btn");
    const layoutBtn = this.container.querySelector("#header-layout-btn");
    const searchBtn = this.container.querySelector("#header-search-btn");
    const userBtn = this.container.querySelector("#header-user-btn");
    const userDropdown = this.container.querySelector("#user-dropdown");
    const logoutBtn = this.container.querySelector("#logout-btn");
    
    const fontInc = this.container.querySelector("#font-inc");
    const fontDec = this.container.querySelector("#font-dec");
    const fontVal = this.container.querySelector("#font-val");
    const usernameSpan = this.container.querySelector("#header-username");
    const layoutIcon = this.container.querySelector("#layout-icon");

    if (authStore.getState().user?.username) {
      usernameSpan.textContent = authStore.getState().user.username;
    }

    menuBtn.addEventListener("click", () => {
      uiStore.toggleExplorer();
    });

    layoutBtn.addEventListener("click", () => {
      uiStore.toggleLayoutDir();
    });

    searchBtn.addEventListener("click", () => {
      uiStore.setCommandPaletteOpen(true);
    });

    userBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    });

    // Close settings clicking outside
    document.addEventListener("click", (e) => {
      if (!userDropdown.classList.contains("hidden") && !userDropdown.contains(e.target)) {
        userDropdown.classList.add("hidden");
      }
    });

    fontInc.addEventListener("click", () => uiStore.fontInc());
    fontDec.addEventListener("click", () => uiStore.fontDec());

    logoutBtn.addEventListener("click", () => {
      authStore.logout();
    });

    this.unsubscribeUi = uiStore.subscribe(state => {
      fontVal.innerText = state.fontSize;
      
      const newIconName = state.layoutDir === "horizontal" ? "rows-2" : "columns-2";
      if (layoutIcon.getAttribute("data-lucide") !== newIconName) {
        layoutIcon.setAttribute("data-lucide", newIconName);
        if (window.lucide) {
          lucide.createIcons({ root: layoutBtn });
        }
      }
    });
  }

  destroy() {
    if (this.unsubscribeUi) this.unsubscribeUi();
    this.container.innerHTML = "";
  }
}

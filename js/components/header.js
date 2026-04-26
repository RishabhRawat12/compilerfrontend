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
      <header class="h-12 border-b border-border bg-surface-1 flex items-center justify-between px-4 shrink-0 transition-colors">
        <div class="flex items-center gap-3">
          <button id="header-menu-btn" class="size-8 flex items-center justify-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle explorer">
            <i data-lucide="menu" class="size-4"></i>
          </button>
          
          <div class="flex items-center gap-2 px-2 border-l border-border/50 ml-1">
            <span class="size-6 rounded bg-gradient-primary flex items-center justify-center shadow-elegant">
              <i data-lucide="zap" class="size-3 text-primary-foreground"></i>
            </span>
            <span class="font-semibold text-sm tracking-tight text-foreground">CompilerHub</span>
          </div>
        </div>

        <!-- Command Palette Trigger Hint -->
        <button id="header-search-btn" class="hidden md:flex items-center gap-2 px-3 h-8 rounded-md bg-surface-2 border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all flex-1 max-w-sm mx-4">
          <i data-lucide="search" class="size-3.5"></i>
          <span class="flex-1 text-left">Search files...</span>
          <kbd class="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-surface-3 px-1.5 font-mono text-[10px] font-medium text-subtle-foreground opacity-100">
            <span class="text-xs">⌘</span>K
          </kbd>
        </button>

        <div class="flex items-center gap-2">
          <div class="relative">
            <button id="header-settings-btn" class="size-8 flex items-center justify-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors">
              <i data-lucide="settings-2" class="size-4"></i>
            </button>
            <div id="settings-dropdown" class="hidden absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50 py-1">
              <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</div>
              <div class="px-2 py-1 flex items-center justify-between text-sm">
                <span>Font Size</span>
                <div class="flex items-center gap-2 bg-surface-2 rounded px-1">
                  <button id="font-dec" class="hover:text-primary"><i data-lucide="minus" class="size-3"></i></button>
                  <span id="font-val" class="font-mono text-xs w-4 text-center">14</span>
                  <button id="font-inc" class="hover:text-primary"><i data-lucide="plus" class="size-3"></i></button>
                </div>
              </div>
            </div>
          </div>
          <button id="header-logout-btn" class="size-8 flex items-center justify-center rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors" title="Log out">
            <i data-lucide="log-out" class="size-4"></i>
          </button>
        </div>
      </header>
    `;

    if (window.lucide) {
      lucide.createIcons({ root: this.container });
    }
  }

  bindEvents() {
    const menuBtn = this.container.querySelector("#header-menu-btn");
    const searchBtn = this.container.querySelector("#header-search-btn");
    const settingsBtn = this.container.querySelector("#header-settings-btn");
    const settingsDropdown = this.container.querySelector("#settings-dropdown");
    const logoutBtn = this.container.querySelector("#header-logout-btn");
    
    const fontInc = this.container.querySelector("#font-inc");
    const fontDec = this.container.querySelector("#font-dec");
    const fontVal = this.container.querySelector("#font-val");

    menuBtn.addEventListener("click", () => {
      uiStore.toggleExplorer();
    });

    searchBtn.addEventListener("click", () => {
      uiStore.setCommandPaletteOpen(true);
    });

    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      settingsDropdown.classList.toggle("hidden");
    });

    // Close settings clicking outside
    document.addEventListener("click", (e) => {
      if (!settingsDropdown.classList.contains("hidden") && !settingsDropdown.contains(e.target)) {
        settingsDropdown.classList.add("hidden");
      }
    });

    fontInc.addEventListener("click", () => uiStore.fontInc());
    fontDec.addEventListener("click", () => uiStore.fontDec());

    logoutBtn.addEventListener("click", () => {
      authStore.logout();
    });

    this.unsubscribeUi = uiStore.subscribe(state => {
      fontVal.innerText = state.fontSize;
    });
  }

  destroy() {
    if (this.unsubscribeUi) this.unsubscribeUi();
    this.container.innerHTML = "";
  }
}

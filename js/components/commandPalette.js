import { uiStore } from "../store/uiStore.js";
import { fsStore } from "../store/fsStore.js";
import { renderIcons } from "../lib/utils.js";

export class CommandPalette {
  constructor(container) {
    this.container = container;
    this.unsubscribeUi = null;
    this.unsubscribeFs = null;
    this.files = [];
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div id="cmd-palette-backdrop" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm hidden flex items-start justify-center pt-[15vh]">
        <div id="cmd-palette-modal" class="w-full max-w-lg border border-border bg-popover text-popover-foreground shadow-2xl rounded-xl overflow-hidden panel transform scale-95 opacity-0 transition-all duration-200">
          <div class="flex items-center border-b border-border px-3">
            <i data-lucide="search" class="size-4 shrink-0 text-muted-foreground mr-2"></i>
            <input id="cmd-input" type="text" class="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" placeholder="Search files or commands...">
          </div>
          <div id="cmd-results" class="max-h-72 overflow-y-auto p-2 hidden">
            <!-- Results injected here -->
          </div>
          <div class="p-2 hidden" id="cmd-empty">
            <p class="text-sm text-center text-muted-foreground py-6">No results found.</p>
          </div>
        </div>
      </div>
    `;
    renderIcons(this.container);
  }

  bindEvents() {
    const backdrop = this.container.querySelector("#cmd-palette-backdrop");
    const modal = this.container.querySelector("#cmd-palette-modal");
    const input = this.container.querySelector("#cmd-input");
    const resultsContainer = this.container.querySelector("#cmd-results");
    const emptyState = this.container.querySelector("#cmd-empty");

    const closePalette = () => uiStore.setCommandPaletteOpen(false);

    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) closePalette();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !backdrop.classList.contains("hidden")) {
        closePalette();
      }
    });

    input.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      if (!q) {
        resultsContainer.innerHTML = "";
        resultsContainer.classList.add("hidden");
        emptyState.classList.add("hidden");
        return;
      }

      // Filter files
      const matches = this.files.filter(f => f.name.toLowerCase().includes(q));
      
      if (matches.length === 0) {
        resultsContainer.classList.add("hidden");
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        resultsContainer.classList.remove("hidden");
        resultsContainer.innerHTML = matches.map(f => `
          <button data-id="${f.id}" class="cmd-item w-full flex items-center px-2 py-2 text-sm rounded-md hover:bg-surface-2 transition-colors text-left text-foreground">
            <i data-lucide="file" class="size-4 mr-2 text-muted-foreground"></i>
            ${f.name}
          </button>
        `).join("");
        renderIcons(resultsContainer);
      }
    });

    resultsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".cmd-item");
      if (btn) {
        const id = btn.getAttribute("data-id");
        if (id && fsStore) {
          fsStore.peekFile(id);
        }
        closePalette();
      }
    });

    this.unsubscribeUi = uiStore.subscribe(state => {
      if (state.commandPaletteOpen) {
        backdrop.classList.remove("hidden");
        // Animate in
        requestAnimationFrame(() => {
          modal.classList.remove("scale-95", "opacity-0");
          modal.classList.add("scale-100", "opacity-100");
        });
        input.value = "";
        input.focus();
        resultsContainer.innerHTML = "";
        resultsContainer.classList.add("hidden");
        emptyState.classList.add("hidden");
      } else {
        modal.classList.remove("scale-100", "opacity-100");
        modal.classList.add("scale-95", "opacity-0");
        setTimeout(() => {
          backdrop.classList.add("hidden");
        }, 200);
      }
    });

    // We will bind fsStore later if it exists initially or listen dynamically
    // Use an interval or simple hack to poll for fsStore if imported async
    const checkFs = setInterval(() => {
      if (window.fsStoreInstance) { // Or export it globally for this to work easily
        this.unsubscribeFs = window.fsStoreInstance.subscribe(state => {
          this.files = state.files || [];
        });
        // initial
        this.files = window.fsStoreInstance.getState().files;
        clearInterval(checkFs);
      }
    }, 100);
  }

  destroy() {
    if (this.unsubscribeUi) this.unsubscribeUi();
    if (this.unsubscribeFs) this.unsubscribeFs();
    this.container.innerHTML = "";
  }
}

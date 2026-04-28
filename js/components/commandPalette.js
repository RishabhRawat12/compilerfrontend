import { uiStore } from "../store/uiStore.js";
import { fsStore } from "../store/fsStore.js";
import { renderIcons } from "../lib/utils.js";
import { toast } from "../lib/toast.js";

const COMMANDS = [
  { id: "new-file", name: "New File", category: "File", keys: "Ctrl+Alt+N", action: "new-file" },
  { id: "open-settings", name: "Open Settings", category: "Editor", keys: "Ctrl+,", action: "open-settings" },
  { id: "run-code", name: "Run/Compile", category: "Compiler", keys: "Ctrl+Enter", action: "run-code" },
  { id: "save-file", name: "Save File", category: "File", keys: "Ctrl+S", action: "save-file" },
  { id: "toggle-explorer", name: "Toggle Explorer", category: "View", keys: "Ctrl+B", action: "toggle-explorer" },
  { id: "toggle-minimap", name: "Toggle Minimap", category: "Editor", keys: "", action: "toggle-minimap" },
  { id: "switch-layout", name: "Switch Layout", category: "View", keys: "", action: "switch-layout" },
  { id: "clear-output", name: "Clear Output", category: "Compiler", keys: "", action: "clear-output" },
  { id: "format-code", name: "Format Code", category: "Editor", keys: "Alt+Shift+F", action: "format-code" },
  { id: "search-files", name: "Search Files", category: "File", keys: "Ctrl+P", action: "search-files" }
];

export class CommandPalette {
  constructor(container) {
    this.container = container;
    this.unsubscribeUi = null;
    this.unsubscribeFs = null;
    this.files = [];
    this.selectedIndex = 0;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div id="cmd-palette-backdrop" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm hidden flex items-start justify-center pt-[15vh]">
        <div id="cmd-palette-modal" class="w-full max-w-2xl border border-border bg-popover text-popover-foreground shadow-2xl rounded-xl overflow-hidden panel transform scale-95 opacity-0 transition-all duration-200 flex flex-col max-h-96">
          <div class="flex items-center border-b border-border px-4">
            <i data-lucide="search" class="size-4 shrink-0 text-muted-foreground mr-3"></i>
            <input id="cmd-input" type="text" class="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" placeholder="Search commands, files... (? for help)">
          </div>
          
          <div id="cmd-results" class="flex-1 overflow-y-auto p-2 hidden">
            <!-- Results injected here -->
          </div>
          
          <div class="p-3 hidden text-center" id="cmd-empty">
            <p class="text-sm text-muted-foreground py-2">No results found. Try typing a command name or file.</p>
          </div>

          <div id="cmd-help" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <div class="text-xs font-semibold text-muted-foreground uppercase mb-2">Quick Commands</div>
            <div id="cmd-quick" class="grid gap-2">
              <!-- Quick commands injected here -->
            </div>
            <div class="h-px bg-border my-2"></div>
            <div class="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent History</div>
            <div id="cmd-history" class="grid gap-1">
              <!-- History injected here -->
            </div>
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
    const helpContainer = this.container.querySelector("#cmd-help");

    const closePalette = () => uiStore.setCommandPaletteOpen(false);

    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) closePalette();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !backdrop.classList.contains("hidden")) {
        closePalette();
      }
      // Arrow keys for navigation
      if (!backdrop.classList.contains("hidden")) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.getResultCount() - 1);
          this.highlightSelected();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          this.highlightSelected();
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const selected = resultsContainer.querySelector("[data-selected='true']");
          if (selected) selected.click();
        }
      }
    });

    input.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      this.selectedIndex = 0;

      if (!q) {
        resultsContainer.classList.add("hidden");
        helpContainer.classList.remove("hidden");
        emptyState.classList.add("hidden");
        this.renderHelp();
        return;
      }

      if (q === "?") {
        this.renderCommandHelp();
        helpContainer.classList.add("hidden");
        resultsContainer.classList.remove("hidden");
        emptyState.classList.add("hidden");
        return;
      }

      // Search commands and files
      const commandMatches = COMMANDS.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q)
      );
      
      const fileMatches = this.files.filter(f => f.name.toLowerCase().includes(q)).slice(0, 5);
      
      const allMatches = [
        ...commandMatches.map(c => ({ ...c, type: "command" })),
        ...fileMatches.map(f => ({ ...f, type: "file" }))
      ];

      if (allMatches.length === 0) {
        resultsContainer.classList.add("hidden");
        helpContainer.classList.add("hidden");
        emptyState.classList.remove("hidden");
      } else {
        helpContainer.classList.add("hidden");
        emptyState.classList.add("hidden");
        resultsContainer.classList.remove("hidden");
        resultsContainer.innerHTML = this.renderResults(allMatches);
        renderIcons(resultsContainer);
        this.highlightSelected();
      }
    });

    resultsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".cmd-item");
      if (!btn) return;

      const id = btn.getAttribute("data-id");
      const type = btn.getAttribute("data-type");

      if (type === "file" && fsStore) {
        fsStore.peekFile(id);
        uiStore.addCommandHistory(`Open file: ${btn.textContent.trim()}`);
      } else if (type === "command") {
        uiStore.addCommandHistory(btn.textContent.trim());
        this.executeCommand(btn.getAttribute("data-action"));
      }

      closePalette();
    });

    this.unsubscribeUi = uiStore.subscribe(state => {
      if (state.commandPaletteOpen) {
        backdrop.classList.remove("hidden");
        requestAnimationFrame(() => {
          modal.classList.remove("scale-95", "opacity-0");
          modal.classList.add("scale-100", "opacity-100");
        });
        input.value = "";
        input.focus();
        resultsContainer.classList.add("hidden");
        helpContainer.classList.remove("hidden");
        emptyState.classList.add("hidden");
        this.renderHelp();
        this.selectedIndex = 0;
      } else {
        modal.classList.remove("scale-100", "opacity-100");
        modal.classList.add("scale-95", "opacity-0");
        setTimeout(() => {
          backdrop.classList.add("hidden");
        }, 200);
      }
    });

    // Fetch files
    const checkFs = setInterval(() => {
      if (window.fsStoreInstance || fsStore) {
        this.unsubscribeFs = (window.fsStoreInstance || fsStore).subscribe(state => {
          this.files = state.files || [];
        });
        this.files = (window.fsStoreInstance || fsStore).getState().files;
        clearInterval(checkFs);
      }
    }, 100);
  }

  renderResults(matches) {
    return matches.map((item, idx) => {
      const isSelected = idx === this.selectedIndex;
      if (item.type === "file") {
        return `
          <button data-id="${item.id}" data-type="file" ${isSelected ? "data-selected='true'" : ""} class="cmd-item w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-surface-2 transition-colors text-left text-foreground ${isSelected ? 'bg-surface-2' : ''}">
            <i data-lucide="file" class="size-4 mr-2 text-muted-foreground"></i>
            <span class="flex-1">${item.name}</span>
            <span class="text-xs text-muted-foreground">file</span>
          </button>
        `;
      } else {
        return `
          <button data-id="${item.id}" data-type="command" data-action="${item.action}" ${isSelected ? "data-selected='true'" : ""} class="cmd-item w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-surface-2 transition-colors text-left text-foreground ${isSelected ? 'bg-surface-2' : ''}">
            <i data-lucide="command" class="size-4 mr-2 text-primary"></i>
            <span class="flex-1">${item.name}</span>
            ${item.keys ? `<span class="text-xs text-muted-foreground font-mono bg-surface-1 px-1.5 py-0.5 rounded">${item.keys}</span>` : ''}
          </button>
        `;
      }
    }).join("");
  }

  renderHelp() {
    const historyEl = this.container.querySelector("#cmd-history");
    const quickEl = this.container.querySelector("#cmd-quick");
    const { commandHistory } = uiStore.getState();

    if (quickEl) {
      const topCommands = COMMANDS.slice(0, 6);
      quickEl.innerHTML = topCommands.map(cmd => `
        <button class="cmd-item flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-surface-2 transition-colors text-left text-foreground" data-id="${cmd.id}" data-type="command" data-action="${cmd.action}">
          <i data-lucide="command" class="size-3.5 text-primary"></i>
          <span class="flex-1">${cmd.name}</span>
          ${cmd.keys ? `<span class="text-[10px] text-muted-foreground font-mono">${cmd.keys}</span>` : ''}
        </button>
      `).join("");
      renderIcons(quickEl);

      quickEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".cmd-item");
        if (btn) {
          uiStore.addCommandHistory(btn.textContent.trim());
          this.executeCommand(btn.dataset.action);
          uiStore.setCommandPaletteOpen(false);
        }
      });
    }

    if (historyEl) {
      if (commandHistory.length === 0) {
        historyEl.innerHTML = '<p class="text-xs text-muted-foreground italic p-2">No history yet</p>';
      } else {
        historyEl.innerHTML = commandHistory.slice(0, 5).map(cmd => `
          <div class="text-xs text-muted-foreground px-2 py-1 hover:text-foreground cursor-pointer">${cmd}</div>
        `).join("");
      }
    }
  }

  renderCommandHelp() {
    const resultsContainer = this.container.querySelector("#cmd-results");
    const grouped = {};
    
    COMMANDS.forEach(cmd => {
      if (!grouped[cmd.category]) grouped[cmd.category] = [];
      grouped[cmd.category].push(cmd);
    });

    resultsContainer.innerHTML = Object.entries(grouped).map(([cat, cmds]) => `
      <div class="mb-3">
        <div class="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">${cat}</div>
        ${cmds.map((cmd, idx) => `
          <button data-id="${cmd.id}" data-type="command" data-action="${cmd.action}" class="cmd-item w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-surface-2 transition-colors text-left text-foreground">
            <span class="flex-1">${cmd.name}</span>
            ${cmd.keys ? `<span class="text-xs text-muted-foreground font-mono bg-surface-1 px-1.5 py-0.5 rounded">${cmd.keys}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `).join("");

    renderIcons(resultsContainer);

    resultsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".cmd-item");
      if (btn) {
        this.executeCommand(btn.dataset.action);
        uiStore.setCommandPaletteOpen(false);
      }
    });
  }

  executeCommand(action) {
    switch (action) {
      case "new-file":
        window.dispatchEvent(new CustomEvent("compilerhub:new-file"));
        break;
      case "open-settings":
        window.dispatchEvent(new CustomEvent("compilerhub:open-settings"));
        break;
      case "run-code":
        window.dispatchEvent(new CustomEvent("compilerhub:action-run"));
        break;
      case "save-file":
        window.dispatchEvent(new CustomEvent("compilerhub:action-save"));
        break;
      case "toggle-explorer":
        uiStore.toggleExplorer();
        break;
      case "toggle-minimap":
        uiStore.toggleMinimap();
        break;
      case "switch-layout":
        uiStore.toggleLayoutDir();
        break;
      case "search-files":
        window.dispatchEvent(new CustomEvent("compilerhub:search-files"));
        break;
    }
  }

  getResultCount() {
    const resultsContainer = this.container.querySelector("#cmd-results");
    return resultsContainer.querySelectorAll(".cmd-item").length;
  }

  highlightSelected() {
    const items = this.container.querySelectorAll(".cmd-item");
    items.forEach((item, idx) => {
      if (idx === this.selectedIndex) {
        item.setAttribute("data-selected", "true");
        item.classList.add("bg-surface-2");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.removeAttribute("data-selected");
        item.classList.remove("bg-surface-2");
      }
    });
  }

  destroy() {
    if (this.unsubscribeUi) this.unsubscribeUi();
    if (this.unsubscribeFs) this.unsubscribeFs();
    this.container.innerHTML = "";
  }
}


import { compilerStore } from "../store/compilerStore.js";
import { uiStore } from "../store/uiStore.js";
import { fsStore } from "../store/fsStore.js";
import { renderIcons } from "../lib/utils.js";

export class StatusBar {
  constructor(container) {
    this.container = container;
    this.unsubscribeComp = null;
    this.unsubscribeFs = null;
    this.unsubscribeUi = null;
    this.cursorPos = { line: 1, col: 1 };
    this.compilationTime = 0;
    this.render();
    this.bindEvents();

    this.unsubscribeComp = compilerStore.subscribe(state => {
      this.updateCompilationStatus();
    });

    this.unsubscribeFs = fsStore.subscribe(state => {
      this.updateFileInfo();
    });

    this.unsubscribeUi = uiStore.subscribe(state => {
      this.updateCursorPosition(state.cursorPosition);
    });
  }

  render() {
    this.container.innerHTML = `
      <footer class="h-7 shrink-0 border-t border-border bg-surface-1 flex items-center justify-between px-4 text-[11px] font-mono text-muted-foreground select-none gap-4">
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <div id="sb-diagnostics" class="flex items-center gap-3 hover:text-foreground transition-colors cursor-pointer">
            <div class="flex items-center gap-1.5">
              <i data-lucide="x-circle" class="size-3.5 text-destructive/80"></i>
              <span id="sb-errors">0</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="alert-triangle" class="size-3.5 text-warning/80"></i>
              <span id="sb-warnings">0</span>
            </div>
          </div>
          
          <div class="w-px h-4 bg-border/30"></div>

          <div id="sb-file-info" class="flex items-center gap-4">
            <div class="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
              <i data-lucide="file" class="size-3.5"></i>
              <span id="sb-filename">untitled</span>
            </div>
            <div class="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
              <i data-lucide="type" class="size-3.5"></i>
              <span>C</span>
            </div>
            <div class="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
              <i data-lucide="hard-drive" class="size-3.5"></i>
              <span>UTF-8</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div id="sb-compilation" class="flex items-center gap-1.5 text-success/80">
            <i data-lucide="check-circle-2" class="size-3.5"></i>
            <span id="sb-comp-status">Ready</span>
          </div>

          <div class="w-px h-4 bg-border/30"></div>

          <div id="sb-cursor" class="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer" title="Cursor Position">
            <i data-lucide="move" class="size-3.5"></i>
            <span>Ln 1, Col 1</span>
          </div>

          <div id="sb-spaces" class="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer" title="Indentation">
            <i data-lucide="spaces" class="size-3.5"></i>
            <span id="sb-tab-size">2</span>
          </div>
        </div>
      </footer>
    `;
    renderIcons(this.container);
  }

  bindEvents() {
    this.cursorEl = this.container.querySelector("#sb-cursor");
    this.filenameEl = this.container.querySelector("#sb-filename");
    this.tabSizeEl = this.container.querySelector("#sb-tab-size");
    
    this.onCursorMove = (e) => {
      const { line, col } = e.detail;
      this.updateCursorPosition({ line, col });
    };
    
    window.addEventListener("compilerhub:cursor", this.onCursorMove);

    // Click handlers for interactive elements
    const diagnosticsEl = this.container.querySelector("#sb-diagnostics");
    if (diagnosticsEl) {
      diagnosticsEl.onclick = () => {
        // Show problems panel
        window.dispatchEvent(new CustomEvent("compilerhub:show-problems"));
      };
    }

    const cursorEl = this.container.querySelector("#sb-cursor");
    if (cursorEl) {
      cursorEl.onclick = () => {
        uiStore.setState({ commandPaletteOpen: true });
        uiStore.addCommandHistory("Go to Line");
      };
    }

    const tabSizeEl = this.container.querySelector("#sb-spaces");
    if (tabSizeEl) {
      tabSizeEl.onclick = () => {
        const settings = new (require("../components/settingsDialog.js").SettingsDialog)();
        settings.show("editor");
      };
    }
  }

  updateCompilationStatus() {
    const { isCompiling, response } = compilerStore.getState();
    const compStatusEl = this.container.querySelector("#sb-comp-status");
    const diagnosticsEl = this.container.querySelector("#sb-diagnostics");

    if (isCompiling) {
      compStatusEl.textContent = "Compiling...";
      compStatusEl.parentElement.classList.remove("text-success/80");
      compStatusEl.parentElement.classList.add("text-primary/80", "animate-pulse");
    } else if (response) {
      const errors = compilerStore.totalErrors();
      const warnings = compilerStore.totalWarnings();
      
      if (errors > 0) {
        compStatusEl.textContent = `${errors} error${errors !== 1 ? 's' : ''}`;
        compStatusEl.parentElement.classList.add("text-destructive/80");
        compStatusEl.parentElement.classList.remove("text-success/80", "text-primary/80", "animate-pulse");
      } else if (warnings > 0) {
        compStatusEl.textContent = `${warnings} warning${warnings !== 1 ? 's' : ''}`;
        compStatusEl.parentElement.classList.add("text-warning/80");
        compStatusEl.parentElement.classList.remove("text-success/80", "text-primary/80", "animate-pulse");
      } else {
        compStatusEl.textContent = "Ready";
        compStatusEl.parentElement.classList.add("text-success/80");
        compStatusEl.parentElement.classList.remove("text-destructive/80", "text-warning/80", "text-primary/80", "animate-pulse");
      }

      // Update error/warning counts
      this.container.querySelector("#sb-errors").textContent = errors;
      this.container.querySelector("#sb-warnings").textContent = warnings;
    } else {
      compStatusEl.textContent = "Ready";
      compStatusEl.parentElement.classList.add("text-success/80");
      compStatusEl.parentElement.classList.remove("text-destructive/80", "text-warning/80", "text-primary/80", "animate-pulse");
    }
  }

  updateFileInfo() {
    const { activeFileId, files } = fsStore.getState();
    const activeFile = files.find(f => f.id === activeFileId);

    if (this.filenameEl && activeFile) {
      this.filenameEl.textContent = activeFile.name;
    }
  }

  updateCursorPosition(pos = {}) {
    const line = pos.line || 1;
    const col = pos.col || 1;
    if (this.cursorEl) {
      this.cursorEl.textContent = `Ln ${line}, Col ${col}`;
    }
  }

  destroy() {
    if (this.unsubscribeComp) this.unsubscribeComp();
    if (this.unsubscribeFs) this.unsubscribeFs();
    if (this.unsubscribeUi) this.unsubscribeUi();
    window.removeEventListener("compilerhub:cursor", this.onCursorMove);
    this.container.innerHTML = "";
  }
}

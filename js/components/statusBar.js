export class StatusBar {
  constructor(container) {
    this.container = container;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <footer class="h-6 shrink-0 border-t border-border bg-surface-1 flex items-center justify-between px-3 text-2xs font-mono text-muted-foreground select-none">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
            <i data-lucide="x-circle" class="size-3 text-destructive/80"></i>
            <span id="sb-errors">0</span>
            <i data-lucide="alert-triangle" class="size-3 text-warning/80 ml-1"></i>
            <span id="sb-warnings">0</span>
          </div>
          <span class="flex items-center gap-1"><i data-lucide="check" class="size-3 text-success/80"></i> Prettier</span>
        </div>
        
        <div class="flex items-center gap-4">
          <div id="sb-cursor" class="hover:text-foreground transition-colors cursor-pointer">Ln 1, Col 1</div>
          <div class="hover:text-foreground transition-colors cursor-pointer">UTF-8</div>
          <div class="hover:text-foreground transition-colors cursor-pointer">C</div>
        </div>
      </footer>
    `;

    if (window.lucide) {
      lucide.createIcons({ root: this.container });
    }
  }

  bindEvents() {
    this.cursorEl = this.container.querySelector("#sb-cursor");
    
    this.onCursorMove = (e) => {
      const { line, col } = e.detail;
      this.cursorEl.textContent = `Ln ${line}, Col ${col}`;
    };
    
    window.addEventListener("compilerhub:cursor", this.onCursorMove);
  }

  updateDiagnostics(errCount, warnCount) {
    this.container.querySelector("#sb-errors").textContent = errCount;
    this.container.querySelector("#sb-warnings").textContent = warnCount;
  }

  destroy() {
    window.removeEventListener("compilerhub:cursor", this.onCursorMove);
    this.container.innerHTML = "";
  }
}

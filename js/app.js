import { uiStore } from "./store/uiStore.js";
import { toast } from "./lib/toast.js";
import { renderIcons } from "./lib/utils.js";

class App {
  constructor() {
    this.root = document.getElementById("app");
    this.currentViewInstance = null;
    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.handleRoute());
    // Global keyboard listener
    this.setupGlobalShortcuts();
    // Initial route
    this.handleRoute();
  }

  async handleRoute() {
    let path = window.location.hash || "#/";
    
    // Support deep pathname linking
    if (path === "#/" && window.location.pathname !== "/") {
      path = "#" + window.location.pathname;
    }

    // Cleanup previous view
    if (this.currentViewInstance && this.currentViewInstance.destroy) {
      try {
        this.currentViewInstance.destroy();
      } catch (e) {
        console.error("View cleanup failed:", e);
      }
    }
    
    // We clear with a placeholder to avoid "blank flash" if possible, 
    // but the user wants an error boundary.
    this.root.innerHTML = '<div class="h-screen flex items-center justify-center bg-surface-0"><i data-lucide="loader-2" class="size-6 animate-spin text-primary"></i></div>';
    renderIcons(this.root);

    try {
      if (path === "#/" || path.startsWith("#/auth")) {
        const { AuthView } = await import("./views/authView.js");
        this.root.innerHTML = "";
        this.currentViewInstance = new AuthView(this.root);
      } else if (path.startsWith("#/workspace")) {
        const { WorkspaceView } = await import("./views/workspaceView.js");
        this.root.innerHTML = "";
        this.currentViewInstance = new WorkspaceView(this.root);
      } else {
        this.root.innerHTML = `
          <div class="h-screen flex flex-col items-center justify-center bg-surface-0 text-center px-4">
            <h1 class="text-4xl font-bold text-primary mb-2">404</h1>
            <p class="text-muted-foreground mb-6">The module you requested does not exist.</p>
            <a href="#/" class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-glow transition-all">Recall Home</a>
          </div>
        `;
      }
    } catch (err) {
      console.error("FATAL: View failed to mount. This usually indicates a syntax error in the component bundle.", err);
      this.root.innerHTML = `
        <div class="h-screen flex flex-col items-center justify-center bg-surface-0 text-center px-6">
          <div class="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
            <i data-lucide="alert-octagon" class="size-8"></i>
          </div>
          <h2 class="text-lg font-bold text-foreground mb-2">System Collision</h2>
          <p class="text-sm text-muted-foreground max-w-md mb-6">
            A fatal error occurred while loading the application view. This is often caused by unresolved syntax in the module logic.
          </p>
          <div class="bg-surface-1 p-4 rounded-md border border-border font-mono text-[11px] text-destructive mb-6 w-full max-w-xl text-left overflow-auto max-h-48">
            ${err.message}<br/>${err.stack.split('\n').join('<br/>')}
          </div>
          <button onclick="window.location.reload()" class="px-6 py-2 border border-border rounded-md hover:bg-surface-2 transition-all">Reload Subsystem</button>
        </div>
      `;
      renderIcons(this.root);
    }
  }

  setupGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl) {
        if (e.key === 's') { e.preventDefault(); window.dispatchEvent(new CustomEvent("compilerhub:action-save")); }
        if (e.key === 'Enter') { e.preventDefault(); window.dispatchEvent(new CustomEvent("compilerhub:action-run")); }
        if (e.key === 'k') { e.preventDefault(); uiStore.setCommandPaletteOpen(true); }
        if (e.key === 'b') { e.preventDefault(); uiStore.toggleExplorer(); }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

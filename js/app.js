import { uiStore } from "./store/uiStore.js";
import { toast } from "./lib/toast.js";

// Import Views (we will build these next)
// import { AuthView } from "./views/authView.js";
// import { WorkspaceView } from "./views/workspaceView.js";

class App {
  constructor() {
    this.root = document.getElementById("app");
    this.currentViewInstance = null;

    // Listen for hash changes for routing
    window.addEventListener("hashchange", () => this.handleRoute());
    
    // Setup global keyboard shortcuts
    this.setupGlobalShortcuts();

    // Initial setup
    toast.init();
    
    // Initial route
    this.handleRoute();
  }

  async handleRoute() {
    let path = window.location.hash || "#/";
    
    // If we're using 'serve -s' and there's no hash, check the pathname
    if (path === "#/" && window.location.pathname !== "/") {
      path = "#" + window.location.pathname;
    }
    
    // Cleanup previous view if needed
    if (this.currentViewInstance && this.currentViewInstance.destroy) {
      this.currentViewInstance.destroy();
    }
    
    this.root.innerHTML = ""; 
    
    if (path === "#/" || path.startsWith("#/auth")) {
      const { AuthView } = await import("./views/authView.js");
      this.currentViewInstance = new AuthView(this.root);
    } else if (path.startsWith("#/workspace")) {
      const { WorkspaceView } = await import("./views/workspaceView.js");
      this.currentViewInstance = new WorkspaceView(this.root);
    } else {
      // 404 fallback
      this.root.innerHTML = `<div class="p-8"><h1 class="text-xl">404 - Not Found</h1><a href="#/" class="text-primary hover:underline">Go Home</a></div>`;
    }

    // After mounting, initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons({ root: this.root });
    }
  }

  setupGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            // Try to trigger save via event bus or specific store action
            // Editor handles this internally first, but we can emit a global intent
            window.dispatchEvent(new CustomEvent("compilerhub:action-save"));
            break;
          case 'enter':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("compilerhub:action-run"));
            break;
          case 'k':
            e.preventDefault();
            const { commandPaletteOpen } = uiStore.getState();
            uiStore.setCommandPaletteOpen(!commandPaletteOpen);
            break;
          case 'b':
            e.preventDefault();
            const { explorerCollapsed } = uiStore.getState();
            uiStore.setExplorerCollapsed(!explorerCollapsed);
            break;
        }
      }
    });
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

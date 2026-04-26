import { uiStore } from "../store/uiStore.js";
import { authStore } from "../store/authStore.js";
import { Header } from "../components/header.js";
import { StatusBar } from "../components/statusBar.js";
import { CommandPalette } from "../components/commandPalette.js";
import { makeResizable } from "../components/resizable.js";
import { FileExplorer } from "../components/fileExplorer.js";
import { CodeEditor } from "../components/codeEditor.js";
import { CompilationPanel } from "../components/compilationPanel.js";

export class WorkspaceView {
  constructor(container) {
    this.container = container;
    this.children = [];
    this.unsubscribeUi = null;
    this.render();
    this.initChildren();
    this.bindEvents();
    
    // Kick off auth check
    authStore.hydrate();
    const { isAuthenticated, token } = authStore.getState();
    if (!isAuthenticated && !token) {
      window.location.hash = "#/auth";
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="h-screen flex flex-col bg-surface-0 overflow-hidden">
        <div id="workspace-header-container"></div>
        
        <main class="flex-1 min-h-0 p-1_5 flex flex-row">
          <!-- Sidebar Explorer -->
          <div id="explorer-panel" class="h-full pr-1 shrink-0" style="flex: 0 0 250px;">
            <div id="workspace-explorer-container" class="h-full"></div>
          </div>
          
          <!-- H-Resizer -->
          <div id="h-resizer" class="w-1_5 shrink-0 bg-transparent hover:bg-primary/30 transition-colors cursor-col-resize z-10 mx-0.5"></div>
          
          <!-- Main Content Area -->
          <div class="flex-1 h-full min-w-0 flex flex-col" id="main-content-area">
            <!-- Editor -->
            <div id="editor-panel" class="w-full shrink-0" style="flex: 0 0 60%;">
              <div id="workspace-editor-container" class="h-full pb-1"></div>
            </div>
            
            <!-- V-Resizer -->
            <div id="v-resizer" class="h-1_5 shrink-0 bg-transparent hover:bg-primary/30 transition-colors cursor-row-resize z-10 my-0.5"></div>
            
            <!-- Compilation Panel -->
            <div id="compilation-panel" class="w-full flex-1 min-h-0 pt-1">
              <div id="workspace-compilation-container" class="h-full"></div>
            </div>
          </div>
        </main>

        <div id="workspace-statusbar-container"></div>
        <div id="workspace-cmdpalette-container"></div>
      </div>
    `;
  }

  async initChildren() {
    this.children.push(new Header(this.container.querySelector("#workspace-header-container")));
    this.children.push(new StatusBar(this.container.querySelector("#workspace-statusbar-container")));
    this.children.push(new CommandPalette(this.container.querySelector("#workspace-cmdpalette-container")));

    // Setup resizers
    this.cleanupHResizer = makeResizable(
      this.container.querySelector("#h-resizer"),
      this.container.querySelector("#explorer-panel"),
      this.container.querySelector("#main-content-area"),
      "horizontal"
    );

    this.cleanupVResizer = makeResizable(
      this.container.querySelector("#v-resizer"),
      this.container.querySelector("#editor-panel"),
      this.container.querySelector("#compilation-panel"),
      "vertical"
    );

    // Initialize stores to globals to make them accessible to command palette etc.
    window.fsStoreInstance = (await import("../store/fsStore.js")).fsStore;

    this.children.push(new FileExplorer(this.container.querySelector("#workspace-explorer-container")));
    this.children.push(new CodeEditor(this.container.querySelector("#workspace-editor-container")));
    this.children.push(new CompilationPanel(this.container.querySelector("#workspace-compilation-container")));
  }

  bindEvents() {
    const explorerPanel = this.container.querySelector("#explorer-panel");
    const hResizer = this.container.querySelector("#h-resizer");

    this.unsubscribeUi = uiStore.subscribe(state => {
      // Toggle explorer
      if (state.explorerCollapsed) {
        explorerPanel.style.display = "none";
        hResizer.style.display = "none";
      } else {
        explorerPanel.style.display = "block";
        hResizer.style.display = "block";
      }
    });
  }

  destroy() {
    if (this.cleanupHResizer) this.cleanupHResizer();
    if (this.cleanupVResizer) this.cleanupVResizer();
    if (this.unsubscribeUi) this.unsubscribeUi();
    this.children.forEach(c => {
      if (c.destroy) c.destroy();
    });
    this.container.innerHTML = "";
  }
}

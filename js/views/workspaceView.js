import { uiStore } from "../store/uiStore.js";
import { authStore } from "../store/authStore.js";
import { Header } from "../components/header.js";
import { StatusBar } from "../components/statusBar.js";
import { CommandPalette } from "../components/commandPalette.js";
import { makeResizable } from "../components/resizable.js";
import { FileExplorer } from "../components/fileExplorer.js";
import { CodeEditor } from "../components/codeEditor.js";
import { CompilationPanel } from "../components/compilationPanel.js";
import { Component } from "../lib/system.js";

export class WorkspaceView extends Component {
  constructor(container) {
    super(container, uiStore);
    this.children = [];
    this.initialized = false;
    this.mount();
  }

  mount() {
    this.render(); // Render base structure
    this.initChildren(); // Create children
    this.afterRender(); // Hydrate
    this.initialized = true;
    
    authStore.hydrate();
    if (!authStore.getState().isAuthenticated) {
      window.location.hash = "#/auth";
    }
  }

  render() {
    // Only render the wrapper structural HTML once
    if (this.initialized) return;

    this.container.innerHTML = `
      <div class="h-screen flex flex-col bg-surface-0 overflow-hidden text-foreground">
        <div id="workspace-header-container"></div>
        <main class="flex-1 min-h-0 flex flex-row">
          <div id="explorer-panel" class="h-full shrink-0" style="flex: 0 0 250px;">
            <div id="workspace-explorer-container" class="h-full"></div>
          </div>
          <div id="h-resizer" class="w-1 px-0.5 shrink-0 bg-transparent hover:bg-primary/30 transition-colors cursor-col-resize z-10">
             <div class="h-full w-px bg-white/5 mx-auto"></div>
          </div>
          <div class="flex-1 h-full min-w-0 flex flex-col" id="main-content-area">
            <div id="editor-panel" class="w-full shrink-0" style="flex: 0 0 60%;">
              <div id="workspace-editor-container" class="h-full px-1.5 py-1"></div>
            </div>
            <div id="v-resizer" class="h-1 py-0.5 shrink-0 bg-transparent hover:bg-primary/30 transition-colors cursor-row-resize z-10">
               <div class="w-full h-px bg-white/5 my-auto"></div>
            </div>
            <div id="compilation-panel" class="w-full flex-1 min-h-0">
              <div id="workspace-compilation-container" class="h-full px-1.5 py-1"></div>
            </div>
          </div>
        </main>
        <div id="workspace-statusbar-container"></div>
        <div id="workspace-cmdpalette-container"></div>
      </div>
    `;
  }

  initChildren() {
    if (this.children.length > 0) return;

    this.children.push(new Header(this.container.querySelector("#workspace-header-container")));
    this.children.push(new StatusBar(this.container.querySelector("#workspace-statusbar-container")));
    this.children.push(new CommandPalette(this.container.querySelector("#workspace-cmdpalette-container")));
    this.children.push(new FileExplorer(this.container.querySelector("#workspace-explorer-container")));
    this.children.push(new CodeEditor(this.container.querySelector("#workspace-editor-container")));
    this.children.push(new CompilationPanel(this.container.querySelector("#workspace-compilation-container")));

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
      () => uiStore.getState().layoutDir
    );
  }

  afterRender() {
    // Only hydration once
    if (this.initialized) return;
    super.afterRender();
    this.listenToState();
  }

  update() {
    // We don't re-render the whole workspace on UI state change
    // The individual children listen to states, and WorkspaceView handles layout shifts
    this.applyLayoutState(uiStore.getState());
  }

  listenToState() {
    this.unsubscribeUiExtra = uiStore.subscribe(state => this.applyLayoutState(state));
    this.applyLayoutState(uiStore.getState());
  }

  applyLayoutState(state) {
    const explorerPanel = this.container.querySelector("#explorer-panel");
    const hResizer = this.container.querySelector("#h-resizer");
    if (!explorerPanel || !hResizer) return;

    explorerPanel.style.display = state.explorerCollapsed ? "none" : "block";
    hResizer.style.display = state.explorerCollapsed ? "none" : "block";

    const mainContent = this.container.querySelector("#main-content-area");
    const vResizer = this.container.querySelector("#v-resizer");
    
    if (state.layoutDir === "horizontal") {
      mainContent.classList.remove("flex-col");
      mainContent.classList.add("flex-row");
      vResizer.classList.add("w-1", "cursor-col-resize");
      vResizer.classList.remove("h-1", "cursor-row-resize");
    } else {
      mainContent.classList.remove("flex-row");
      mainContent.classList.add("flex-col");
      vResizer.classList.remove("w-1", "cursor-col-resize");
      vResizer.classList.add("h-1", "cursor-row-resize");
    }
  }

  destroy() {
    if (this.unsubscribeUiExtra) this.unsubscribeUiExtra();
    if (this.cleanupHResizer) this.cleanupHResizer();
    if (this.cleanupVResizer) this.cleanupVResizer();
    this.children.forEach(c => c.destroy && c.destroy());
    super.destroy();
  }
}


import { getBaseURL, setBaseURL, DEFAULT_BASE_URL } from "../lib/api.js";
import { toast } from "../lib/toast.js";
import { uiStore } from "../store/uiStore.js";
import { renderIcons } from "../lib/utils.js";

export class SettingsDialog {
  constructor() {
    this.container = null;
    this.isOpen = false;
    this.currentTab = "editor";
  }

  show(tab = "editor") {
    if (this.isOpen) return;
    this.isOpen = true;
    this.currentTab = tab;
    this.render();
    this.bindEvents();
  }

  hide() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }

  render() {
    const currentUrl = getBaseURL();
    const { fontSize, enableMinimap, wordWrap, autoSave, tabSize, theme, expandTabs, bracketAutoClose, compilerOptimization, compilerFlags } = uiStore.getState();

    this.container = document.createElement("div");
    this.container.className = "overlay";
    this.container.innerHTML = `
      <div class="modal-content max-w-2xl">
        <div class="flex flex-col gap-1 mb-6">
          <h2 class="text-lg font-semibold text-foreground">Settings</h2>
          <p class="text-xs text-muted-foreground">Customize your CompilerHub experience.</p>
        </div>

        <div class="flex gap-6 mb-8">
          <div class="flex flex-col gap-2 min-w-40">
            <button class="settings-tab text-left px-3 py-2 rounded text-sm font-medium ${this.currentTab === 'editor' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'}" data-tab="editor">
              <i data-lucide="code" class="inline size-4 mr-2"></i> Editor
            </button>
            <button class="settings-tab text-left px-3 py-2 rounded text-sm font-medium ${this.currentTab === 'appearance' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'}" data-tab="appearance">
              <i data-lucide="palette" class="inline size-4 mr-2"></i> Appearance
            </button>
            <button class="settings-tab text-left px-3 py-2 rounded text-sm font-medium ${this.currentTab === 'compiler' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'}" data-tab="compiler">
              <i data-lucide="zap" class="inline size-4 mr-2"></i> Compiler
            </button>
            <button class="settings-tab text-left px-3 py-2 rounded text-sm font-medium ${this.currentTab === 'backend' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'}" data-tab="backend">
              <i data-lucide="server" class="inline size-4 mr-2"></i> Backend
            </button>
          </div>

          <div class="flex-1 flex flex-col gap-4">
            <!-- Editor Settings -->
            <div id="editor-settings" class="${this.currentTab !== 'editor' ? 'hidden' : ''}">
              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-muted-foreground">Font Size</label>
                  <div class="flex items-center gap-2">
                    <input type="range" id="font-size-range" min="8" max="24" value="${fontSize}" class="w-32 h-2 bg-surface-2 rounded-lg appearance-none cursor-pointer">
                    <span id="font-size-display" class="text-xs font-mono w-8 text-right">${fontSize}px</span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-muted-foreground">Tab Size</label>
                  <input type="number" id="tab-size" min="1" max="8" value="${tabSize}" class="input w-20 text-xs text-center">
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-muted-foreground">Insert Spaces</label>
                  <input type="checkbox" id="expand-tabs" class="rounded" ${expandTabs ? 'checked' : ''}>
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-muted-foreground">Word Wrap</label>
                  <input type="checkbox" id="word-wrap" class="rounded" ${wordWrap ? 'checked' : ''}>
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-muted-foreground">Minimap</label>
                  <input type="checkbox" id="minimap" class="rounded" ${enableMinimap ? 'checked' : ''}>
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-muted-foreground">Auto Close Brackets</label>
                  <input type="checkbox" id="bracket-close" class="rounded" ${bracketAutoClose ? 'checked' : ''}>
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-muted-foreground">Auto Save</label>
                  <input type="checkbox" id="auto-save" class="rounded" ${autoSave ? 'checked' : ''}>
                </div>
              </div>
            </div>

            <!-- Appearance Settings -->
            <div id="appearance-settings" class="${this.currentTab !== 'appearance' ? 'hidden' : ''}">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-medium text-muted-foreground">Theme</label>
                  <select id="theme-select" class="input text-xs">
                    <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark</option>
                    <option value="light" ${theme === 'light' ? 'selected' : ''}>Light</option>
                    <option value="auto" ${theme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                  </select>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-xs font-medium text-muted-foreground">Editor Theme</label>
                  <select id="editor-theme-select" class="input text-xs">
                    <option value="vs-dark">VS Dark</option>
                    <option value="vs-light">VS Light</option>
                    <option value="hc-dark">High Contrast</option>
                  </select>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-xs font-medium text-muted-foreground">Accent Color</label>
                  <div class="flex gap-2">
                    <button class="color-swatch" data-color="primary" style="background-color: hsl(var(--primary))" title="Purple"></button>
                    <button class="color-swatch" data-color="accent" style="background-color: hsl(var(--accent))" title="Red"></button>
                    <button class="color-swatch" data-color="success" style="background-color: hsl(var(--success))" title="Green"></button>
                    <button class="color-swatch" data-color="warning" style="background-color: hsl(var(--warning))" title="Orange"></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Compiler Settings -->
            <div id="compiler-settings" class="${this.currentTab !== 'compiler' ? 'hidden' : ''}">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-medium text-muted-foreground">Optimization Level</label>
                  <select id="compiler-opt" class="input text-xs">
                    <option value="-O0" ${compilerOptimization === '-O0' ? 'selected' : ''}>None (-O0)</option>
                    <option value="-O1" ${compilerOptimization === '-O1' ? 'selected' : ''}>Level 1 (-O1)</option>
                    <option value="-O2" ${compilerOptimization === '-O2' ? 'selected' : ''}>Level 2 (-O2)</option>
                    <option value="-O3" ${compilerOptimization === '-O3' ? 'selected' : ''}>Level 3 (-O3)</option>
                    <option value="-Os" ${compilerOptimization === '-Os' ? 'selected' : ''}>Size (-Os)</option>
                  </select>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-xs font-medium text-muted-foreground">Additional Flags</label>
                  <input type="text" id="compiler-flags" class="input text-xs" placeholder="-Wall -Wextra -std=c11" value="${compilerFlags}">
                </div>

                <div class="text-[10px] text-muted-foreground bg-surface-2 p-2 rounded">
                  Example: <code>-Wall -Wextra -std=c11 -pedantic</code>
                </div>
              </div>
            </div>

            <!-- Backend Settings -->
            <div id="backend-settings" class="${this.currentTab !== 'backend' ? 'hidden' : ''}">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="baseURL" class="text-xs font-medium text-muted-foreground">Backend Base URL</label>
                  <input type="text" id="baseURL" class="input text-xs" value="${currentUrl}" placeholder="${DEFAULT_BASE_URL}">
                </div>
                <p class="text-[11px] leading-relaxed text-muted-foreground/70">
                  The server hosting <code class="bg-surface-2 px-1 rounded">/api/auth</code>, 
                  <code class="bg-surface-2 px-1 rounded">/api/fs</code>, and 
                  <code class="bg-surface-2 px-1 rounded">/api/compile</code>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button id="settings-cancel" class="btn btn-ghost px-4 py-2 text-xs">Cancel</button>
          <button id="settings-save" class="btn btn-primary px-6 py-2 text-xs font-semibold shadow-lg shadow-primary/20">Save changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
    renderIcons(this.container);
  }

  bindEvents() {
    const cancelBtn = this.container.querySelector("#settings-cancel");
    const saveBtn = this.container.querySelector("#settings-save");
    const tabButtons = this.container.querySelectorAll(".settings-tab");
    const colorSwatches = this.container.querySelectorAll(".color-swatch");

    // Tab switching
    tabButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = btn.dataset.tab;
        this.currentTab = tab;
        
        // Hide all panels
        this.container.querySelectorAll("[id$='-settings']").forEach(el => {
          el.classList.add("hidden");
        });
        
        // Show selected panel
        this.container.querySelector(`#${tab}-settings`).classList.remove("hidden");
        
        // Update button styles
        tabButtons.forEach(b => {
          if (b.dataset.tab === tab) {
            b.classList.add("bg-primary/20", "text-primary");
            b.classList.remove("text-muted-foreground", "hover:text-foreground", "hover:bg-surface-2");
          } else {
            b.classList.remove("bg-primary/20", "text-primary");
            b.classList.add("text-muted-foreground", "hover:text-foreground", "hover:bg-surface-2");
          }
        });
      });
    });

    // Font size range
    const fontRange = this.container.querySelector("#font-size-range");
    const fontDisplay = this.container.querySelector("#font-size-display");
    if (fontRange) {
      fontRange.addEventListener("input", (e) => {
        const size = e.target.value;
        fontDisplay.textContent = size + "px";
        uiStore.setState({ fontSize: parseInt(size) });
      });
    }

    // Color swatch selection
    colorSwatches.forEach(swatch => {
      swatch.addEventListener("click", (e) => {
        const color = swatch.dataset.color;
        uiStore.setAccentColor(color);
      });
    });

    // Save button
    saveBtn.addEventListener("click", () => {
      // Editor settings
      const fontSize = this.container.querySelector("#font-size-range")?.value;
      const tabSize = this.container.querySelector("#tab-size")?.value;
      const wordWrap = this.container.querySelector("#word-wrap")?.checked;
      const minimap = this.container.querySelector("#minimap")?.checked;
      const autoSave = this.container.querySelector("#auto-save")?.checked;
      const bracketClose = this.container.querySelector("#bracket-close")?.checked;
      const expandTabs = this.container.querySelector("#expand-tabs")?.checked;

      // Appearance settings
      const theme = this.container.querySelector("#theme-select")?.value;
      const editorTheme = this.container.querySelector("#editor-theme-select")?.value;

      // Compiler settings
      const compilerOpt = this.container.querySelector("#compiler-opt")?.value;
      const compilerFlags = this.container.querySelector("#compiler-flags")?.value;

      // Backend settings
      const baseUrl = this.container.querySelector("#baseURL")?.value;

      if (fontSize) uiStore.setState({ fontSize: parseInt(fontSize) });
      if (tabSize) uiStore.setTabSize(parseInt(tabSize));
      if (wordWrap !== undefined) uiStore.setWordWrap(wordWrap);
      if (minimap !== undefined) uiStore.setMinimap(minimap);
      if (autoSave !== undefined) uiStore.setAutoSave(autoSave);
      if (bracketClose !== undefined) uiStore.setState({ bracketAutoClose: bracketClose });
      if (expandTabs !== undefined) uiStore.setState({ expandTabs });
      if (theme) uiStore.setTheme(theme);
      if (editorTheme) uiStore.setSelectedTheme(editorTheme);
      if (compilerOpt) uiStore.setCompilerOptimization(compilerOpt);
      if (compilerFlags !== undefined) uiStore.setCompilerFlags(compilerFlags);
      
      if (baseUrl) {
        setBaseURL(baseUrl.trim().replace(/\/$/, "") || DEFAULT_BASE_URL);
      }

      toast.success("Settings saved successfully");
      this.hide();
    });

    // Cancel button
    cancelBtn.addEventListener("click", () => this.hide());

    // Close on overlay click
    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}

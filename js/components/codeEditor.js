import { fsStore } from "../store/fsStore.js";
import { uiStore } from "../store/uiStore.js";
import { compilerStore, PHASES } from "../store/compilerStore.js";
import { getFileIcon, getLanguageFromName } from "../lib/fileIcons.js";
import { COMPILERHUB_THEME, defineCompilerHubTheme } from "../lib/monacoTheme.js";
import { toast } from "../lib/toast.js";
import { debounce, renderIcons } from "../lib/utils.js";

const DEFAULT_SNIPPET = `int main() {
    int x = 10;
    if (x > 5) {
        x = x + 1;
    }
    return x;
}
`;

export class CodeEditor {
  constructor(container) {
    this.container = container;
    this.fsState = fsStore.getState();
    this.uiState = uiStore.getState();
    this.compilerState = compilerStore.getState();
    
    this.scratch = DEFAULT_SNIPPET;
    this.editor = null;
    this.monaco = null;
    this.models = {};
    this.flashDecorations = [];
    this.hoverDecorations = [];
    
    this.unsubscribeFs = null;
    this.unsubscribeUi = null;
    this.unsubscribeComp = null;

    this.debouncedSave = debounce(() => {
      if (this.fsState.activeFileId && this.fsState.dirty) {
        fsStore.saveActive().catch(() => toast.error("Failed to save file"));
      }
    }, 1000);

    this.render();
    this.initMonaco();
    this.bindEvents();
    
    // Subscribe stores
    this.unsubscribeFs = fsStore.subscribe(s => {
      const prevActiveFileId = this.fsState.activeFileId;
      this.fsState = s;
      this.renderTabs();
      this.renderBreadcrumbs();
      this.renderStatusHint();
      
      if (this.editor) {
        const file = s.files.find(f => f.id === s.activeFileId);
        const fileName = file ? file.name : "scratch.c";
        const val = s.activeFileId ? s.activeContent : this.scratch;
        const lang = getLanguageFromName(fileName);
        const modelId = s.activeFileId || "scratch";
        
        let model = this.models[modelId];
        if (!model && this.monaco) {
          model = this.monaco.editor.createModel(val, lang, this.monaco.Uri.parse(`file:///${modelId}/${fileName}`));
          this.models[modelId] = model;
        }

      this.syncMarkers();
      
      const runBtn = this.container.querySelector("#btn-run");
      if (runBtn) {
        runBtn.disabled = s.isCompiling;
        runBtn.innerHTML = s.isCompiling 
          ? `<i data-lucide="loader-2" class="size-3 mr-1 animate-spin"></i> Running…`
          : `<i data-lucide="play" class="size-3 mr-1"></i> Run`;
        renderIcons(runBtn);
      }
    });

    // Handle global action intents broadcasted from app.js keyboard listener
    this.onGlobalSave = () => {
      if (this.fsState.activeFileId) fsStore.saveActive().catch(() => toast.error("Failed to save"));
    };
    this.onGlobalRun = () => this.handleRun();
    window.addEventListener("compilerhub:action-save", this.onGlobalSave);
    window.addEventListener("compilerhub:action-run", this.onGlobalRun);
  }

  render() {
    this.container.innerHTML = `
      <section class="flex flex-col h-full overflow-hidden bg-surface-1 border border-border rounded-lg relative">
        <!-- Tab Bar -->
        <div class="relative h-9 border-b border-border bg-surface-1 scroll-fade-x" id="editor-tab-wrapper">
          <div id="editor-tablist" role="tablist" class="flex items-stretch h-full overflow-x-auto scrollbar-none" style="-ms-overflow-style:none;scrollbar-width:none;">
            <!-- Tabs injected here -->
          </div>
        </div>

        <!-- Breadcrumbs & Actions Row -->
        <div class="breadcrumb-bar shrink-0">
          <nav aria-label="File path" class="min-w-0 text-[11px] font-mono text-muted-foreground/80">
            <ol class="flex items-center gap-1 min-w-0" id="editor-breadcrumbs">
            </ol>
          </nav>
          
          <div class="flex items-center gap-2 shrink-0">
            <div class="flex items-center rounded-lg border border-border bg-surface-2/50 overflow-hidden h-6">
              <button id="btn-font-dec" class="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                <i data-lucide="minus" class="size-3"></i>
              </button>
              <span id="editor-font-size" class="px-2 text-[10px] font-bold text-muted-foreground/90 border-x border-border/50 h-full flex items-center">14</span>
              <button id="btn-font-inc" class="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                <i data-lucide="plus" class="size-3"></i>
              </button>
            </div>
            <button id="btn-export" class="action-pill text-muted-foreground hover:text-foreground hover-bg-white-5 gap-1.5 px-3 transition-all">
              <i data-lucide="download" class="size-3.5"></i> Export
            </button>
            <button id="btn-run" class="action-pill btn-run gap-1.5 px-4 shadow-lg shadow-purple-500/20">
              <i data-lucide="play" class="size-3.5 fill-current"></i> Run
            </button>
          </div>
        </div>

        <!-- Monaco Container -->
        <div id="monaco-container" class="flex-1 min-h-0 bg-[#0b1020]"></div>

        <!-- Status Hint -->
        <div id="editor-status-hint" class="hidden h-5 px-3 items-center text-2xs font-mono text-muted-foreground border-t border-border bg-surface-1">
        </div>
      </section>
    `;
    renderIcons(this.container);
  }

  initMonaco() {
    if (window.require) {
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], () => {
        this.monaco = window.monaco;
        defineCompilerHubTheme(this.monaco);
        
        const initialFile = this.fsState.files.find(f => f.id === this.fsState.activeFileId);
        const initialFileName = initialFile ? initialFile.name : "scratch.c";
        const initialLang = getLanguageFromName(initialFileName);
        const initialModelId = this.fsState.activeFileId || "scratch";
        const initialVal = this.fsState.activeFileId ? this.fsState.activeContent : this.scratch;

        const initialModel = this.monaco.editor.createModel(initialVal, initialLang, this.monaco.Uri.parse(`file:///${initialModelId}/${initialFileName}`));
        this.models[initialModelId] = initialModel;

        this.editor = this.monaco.editor.create(this.container.querySelector("#monaco-container"), {
          model: initialModel,
          theme: COMPILERHUB_THEME,
          fontSize: this.uiState.fontSize,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontLigatures: true,
          minimap: { enabled: false }, // disable minimap to save memory unless viewport wide
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          automaticLayout: true,
          tabSize: 4,
          renderLineHighlight: "all",
          renderWhitespace: "selection",
          guides: { indentation: true, highlightActiveIndentation: true },
          padding: { top: 12, bottom: 12 },
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        });

        this.editor.onDidChangeModelContent(() => {
          const val = this.editor.getValue();
          if (this.fsState.activeFileId) {
            fsStore.setContent(val);
            this.debouncedSave();
          } else {
            this.scratch = val;
          }
        });

        this.editor.onDidChangeCursorPosition((e) => {
          window.dispatchEvent(
            new CustomEvent("compilerhub:cursor", {
              detail: { line: e.position.lineNumber, col: e.position.column },
            })
          );
        });
        
        this.syncMarkers();
      });
    }
  }

  async handleRun() {
    const val = this.editor ? this.editor.getValue() : this.scratch;
    try {
      await compilerStore.run(val);
      const e = compilerStore.totalErrors();
      const w = compilerStore.totalWarnings();
      toast.success(`Compilation finished — ${e} errors, ${w} warnings`);
    } catch {
      toast.error("Compilation request failed");
    }
  }

  handleExport() {
    const val = this.editor ? this.editor.getValue() : this.scratch;
    const file = this.fsState.files.find(f => f.id === this.fsState.activeFileId);
    const filename = file ? file.name : "scratch.c";
    const blob = new Blob([val], { type: "text/x-c" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  syncMarkers() {
    if (!this.editor || !this.monaco) return;
    const model = this.editor.getModel();
    if (!model) return;

    const markers = [];
    if (this.compilerState.response) {
      for (const phase of PHASES) {
        const pd = this.compilerState.response.data[phase];
        for (const e of pd?.errors || []) {
          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `[${phase}] ${e.message}`,
            startLineNumber: Math.max(1, e.line),
            startColumn: 1,
            endLineNumber: Math.max(1, e.line),
            endColumn: model.getLineMaxColumn(Math.max(1, Math.min(e.line, model.getLineCount()))),
          });
        }
        for (const w of pd?.warnings || []) {
          markers.push({
            severity: this.monaco.MarkerSeverity.Warning,
            message: `[${phase}] ${w.message}`,
            startLineNumber: Math.max(1, w.line),
            startColumn: 1,
            endLineNumber: Math.max(1, w.line),
            endColumn: model.getLineMaxColumn(Math.max(1, Math.min(w.line, model.getLineCount()))),
          });
        }
      }
    }
    this.monaco.editor.setModelMarkers(model, "compilerhub", markers);
  }

  bindEvents() {
    const fontInc = this.container.querySelector("#btn-font-inc");
    const fontDec = this.container.querySelector("#btn-font-dec");
    const exp = this.container.querySelector("#btn-export");
    const run = this.container.querySelector("#btn-run");

    fontInc.addEventListener("click", () => uiStore.fontInc());
    fontDec.addEventListener("click", () => uiStore.fontDec());
    exp.addEventListener("click", () => this.handleExport());
    run.addEventListener("click", () => this.handleRun());

    // Tab dragging fade logic
    const tabWrapper = this.container.querySelector("#editor-tab-wrapper");
    const tablist = this.container.querySelector("#editor-tablist");
    const updateFades = () => {
      const max = tablist.scrollWidth - tablist.clientWidth;
      tabWrapper.style.setProperty("--show-left", tablist.scrollLeft > 4 ? "1" : "0");
      tabWrapper.style.setProperty("--show-right", tablist.scrollLeft < max - 4 ? "1" : "0");
    };
    tablist.addEventListener("scroll", updateFades);
    window.addEventListener("resize", updateFades);
    tablist.addEventListener("wheel", (e) => {
      if (e.deltaX === 0 && e.deltaY !== 0) {
        tablist.scrollLeft += e.deltaY;
        e.preventDefault();
        updateFades();
      }
    });

    // Custom events
    this.onGoto = (e) => {
      if (!this.editor || !this.monaco) return;
      const { line } = e.detail;
      this.editor.revealLineInCenter(line);
      this.editor.setPosition({ lineNumber: line, column: 1 });
      this.editor.focus();
      this.flashDecorations = this.editor.deltaDecorations(this.flashDecorations, [
        {
          range: new this.monaco.Range(line, 1, line, 1),
          options: { isWholeLine: true, className: "editor-line-flash" }
        }
      ]);
      setTimeout(() => {
        if (this.editor) this.flashDecorations = this.editor.deltaDecorations(this.flashDecorations, []);
      }, 1500);
    };

    this.onHighlight = (e) => {
      if (!this.editor || !this.monaco) return;
      const { line } = e.detail;
      if (!line) {
        this.hoverDecorations = this.editor.deltaDecorations(this.hoverDecorations, []);
        return;
      }
      this.hoverDecorations = this.editor.deltaDecorations(this.hoverDecorations, [
        {
          range: new this.monaco.Range(line, 1, line, 1),
          options: { isWholeLine: true, className: "editor-line-flash" }
        }
      ]);
    };

    window.addEventListener("compilerhub:goto-line", this.onGoto);
    window.addEventListener("compilerhub:highlight-line", this.onHighlight);
  }

  renderTabs() {
    const tablist = this.container.querySelector("#editor-tablist");
    const s = this.fsState;

    let tabs = s.openTabs.map(id => {
      const f = s.files.find(x => x.id === id);
      return f ? { id: f.id, name: f.name, isScratch: false, isPreview: id === s.previewTabId } : null;
    }).filter(Boolean);

    if (tabs.length === 0) {
      tabs = [{ id: "__scratch", name: "scratch.c", isScratch: true, isPreview: false }];
    }

    tablist.innerHTML = tabs.map(t => {
      const active = (t.isScratch && !s.activeFileId) || (!t.isScratch && t.id === s.activeFileId);
      const icon = getFileIcon(t.name);
      const showDirtyDot = active && s.dirty && !t.isScratch;
      
      const titleClasses = `group relative flex items-center gap-2 pl-3 pr-2 text-xs-tight font-mono cursor-pointer border-r border-border min-w-0 max-w-[200px] transition-colors ${active ? 'bg-surface-2 text-foreground' : 'bg-surface-1 text-muted-foreground hover:text-foreground hover:bg-surface-2/60'} ${t.isPreview ? 'italic' : ''}`;

      return `
        <div role="tab" data-id="${t.id}" data-scratch="${t.isScratch}" data-active="${active}" class="${titleClasses}">
          ${active ? '<div class="tab-active-indicator"></div>' : ''}
          <i data-lucide="${icon.icon}" class="size-3.5 shrink-0" style="color: ${icon.color || 'inherit'}"></i>
          <span class="truncate">${t.name}</span>
          ${!t.isScratch ? `
            <button class="tab-close-btn ml-1 size-4 flex items-center justify-center rounded hover-bg-white-5 text-muted-foreground hover-text-white transition-all">
              ${showDirtyDot ? '<i data-lucide="circle" class="size-2 text-syntax-warning fill-current"></i>' : '<i data-lucide="x" class="size-3"></i>'}
            </button>
          ` : ''}
        </div>
      `;
    }).join("");


    renderIcons(tablist);

    // Attach tab events
    const tabNodes = tablist.querySelectorAll('[role="tab"]');
    tabNodes.forEach(node => {
      const isScratch = node.getAttribute("data-scratch") === "true";
      const id = node.getAttribute("data-id");

      // Auto-scroll active tab into view
      if (node.getAttribute("data-active") === "true") {
        setTimeout(() => node.scrollIntoView({ behavior: "smooth", inline: "nearest" }), 50);
      }

      node.addEventListener("click", (e) => {
        if (!isScratch && !e.target.closest(".tab-close-btn")) {
          fsStore.peekFile(id);
        }
      });
      node.addEventListener("dblclick", () => {
        if (!isScratch) fsStore.pinFile(id);
      });

      const closeBtn = node.querySelector(".tab-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          fsStore.closeTab(id);
        });
      }
    });

    // Update Fades
    setTimeout(() => {
      const tabWrapper = this.container.querySelector("#editor-tab-wrapper");
      const max = tablist.scrollWidth - tablist.clientWidth;
      tabWrapper.style.setProperty("--show-left", tablist.scrollLeft > 4 ? "1" : "0");
      tabWrapper.style.setProperty("--show-right", tablist.scrollLeft < max - 4 ? "1" : "0");
    }, 100);
  }

  renderBreadcrumbs() {
    const b = this.container.querySelector("#editor-breadcrumbs");
    const activeFile = this.fsState.files.find(f => f.id === this.fsState.activeFileId);
    
    let crumbs = [];
    if (activeFile) {
      let fId = activeFile.folder_id;
      const walk = [];
      while (fId) {
        const folder = this.fsState.folders.find(x => x.id === fId);
        if (!folder) break;
        walk.unshift(folder.name);
        fId = folder.parent_id;
      }
      crumbs = [...walk, activeFile.name];
    } else {
      crumbs = ["scratch.c"];
    }

    b.innerHTML = `<li class="text-subtle-foreground flex items-center gap-1">CompilerHub</li>`;
    crumbs.forEach((c, i) => {
      const last = i === crumbs.length - 1;
      b.innerHTML += `
        <li class="flex items-center gap-1 min-w-0">
          <i data-lucide="chevron-right" class="size-3 shrink-0 text-subtle-foreground"></i>
          <span class="truncate ${last ? 'text-foreground' : ''}">${c}</span>
        </li>
      `;
    });
    renderIcons(b);
  }

  renderStatusHint() {
    const hint = this.container.querySelector("#editor-status-hint");
    if (this.fsState.activeFileId) {
      hint.classList.remove("hidden");
      hint.classList.add("flex");
      hint.textContent = this.fsState.saving ? "saving…" : this.fsState.dirty ? "● unsaved" : "saved";
    } else {
      hint.classList.add("hidden");
      hint.classList.remove("flex");
    }
  }

  destroy() {
    if (this.unsubscribeFs) this.unsubscribeFs();
    if (this.unsubscribeUi) this.unsubscribeUi();
    if (this.unsubscribeComp) this.unsubscribeComp();
    
    window.removeEventListener("compilerhub:action-save", this.onGlobalSave);
    window.removeEventListener("compilerhub:action-run", this.onGlobalRun);
    window.removeEventListener("compilerhub:goto-line", this.onGoto);
    window.removeEventListener("compilerhub:highlight-line", this.onHighlight);

    if (this.editor) this.editor.dispose();
    this.container.innerHTML = "";
  }
}

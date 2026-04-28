import { fsStore } from "../store/fsStore.js";
import { uiStore } from "../store/uiStore.js";
import { compilerStore } from "../store/compilerStore.js";
import { getFileIcon } from "../lib/fileIcons.js";
import { debounce, renderIcons } from "../lib/utils.js";
import { Component } from "../lib/system.js";

export class CodeEditor extends Component {
  constructor(container) {
    super(container, fsStore);
    this.monaco = null;
    this.editor = null;
    this.models = {};
    this.cursorPos = { line: 1, col: 1 };
    
    // Additional subscriptions for secondary stores
    this.unsubscribeUi = uiStore.subscribe(() => this.updateOptions());
    this.unsubscribeCompiler = compilerStore.subscribe(() => this.updateMarkers());
    
    this.mount();
  }

  render() {
    if (this.container.innerHTML) return; 

    const fontSize = uiStore.getState().fontSize;
    const { enableMinimap, wordWrap, autoSave } = uiStore.getState();

    this.container.innerHTML = `
      <section class="flex flex-col h-full bg-surface-1 border border-border rounded-xl overflow-hidden relative">
        <div class="flex items-end bg-surface-0 border-b border-border pl-2 shrink-0 pt-2 relative z-10 overflow-x-auto" id="editor-tabs"></div>
        <div class="h-10 flex items-center justify-between px-4 bg-surface-1 border-b border-white/5 shrink-0 z-0">
          <div id="editor-breadcrumbs" class="flex items-center text-[12px] text-muted-foreground font-mono truncate mr-4"></div>
          <div class="flex items-center gap-3">
            <div class="flex items-center bg-surface-2 rounded-md px-1.5 h-6 gap-2">
              <button id="editor-font-dec" class="hover:text-foreground text-muted-foreground transition-colors p-0 min-w-0" title="Decrease font size (Ctrl+-)">
                <i data-lucide="minus" class="size-3"></i>
              </button>
              <span id="font-size-val" class="text-[11px] font-mono min-w-[14px] text-center">${fontSize}</span>
              <button id="editor-font-inc" class="hover:text-foreground text-muted-foreground transition-colors p-0 min-w-0" title="Increase font size (Ctrl+=)">
                <i data-lucide="plus" class="size-3"></i>
              </button>
            </div>
            <button id="toggle-minimap-btn" class="flex items-center gap-1 h-6 px-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors" title="Toggle minimap">
              <i data-lucide="layout-list" class="size-3.5"></i>
            </button>
            <button id="toggle-wordwrap-btn" class="flex items-center gap-1 h-6 px-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors" title="Toggle word wrap">
              <i data-lucide="text-wrap" class="size-3.5"></i>
            </button>
            <button id="run-btn" class="flex items-center justify-center bg-primary hover:bg-primary/90 text-white fill-white h-7 px-4 rounded-full text-[12px] gap-1.5 shadow-sm font-medium transition-colors">
              <i data-lucide="play" class="size-3.5 fill-current stroke-white stroke-2"></i> Run
            </button>
          </div>
        </div>
        <div id="monaco-container" class="flex-1 min-h-0 bg-[#0b1020]"></div>
      </section>
    `;

    this.initMonaco();
  }

  afterRender() {
    super.afterRender();
    this.update();
    this.bindEvents();
    renderIcons(this.container);
  }


  update() {
    this.updateTabs();
    this.updateBreadcrumbs();
    this.syncEditorContent();
  }

  updateTabs() {
    const el = this.container.querySelector("#editor-tabs");
    if (!el) return;
    const { openTabs, activeFileId, files, dirty } = fsStore.getState();
    const tabs = openTabs.map(id => files.find(f => f.id === id)).filter(Boolean);

    el.innerHTML = tabs.map(t => {
      const active = t.id === activeFileId;
      const icon = getFileIcon(t.name);
      const isDirty = dirty && t.id === activeFileId;
      return `
        <div class="group relative z-10 flex items-center h-8 px-4 text-[13px] font-mono cursor-pointer transition-colors ${active ? 'bg-surface-1 text-white border-t-2 border-t-[#a577fa] rounded-t-xl' : 'bg-transparent text-muted-foreground hover:bg-white/5 rounded-t-xl hover:text-white'}" style="${active ? 'margin-bottom: -1px; padding-bottom: 1px;' : ''}" data-id="${t.id}">
          <i data-lucide="${icon.icon}" class="size-4 mr-2.5" style="color: ${icon.color}"></i>
          <span>${t.name}</span>
          ${isDirty ? '<span class="ml-1 text-[16px]">●</span>' : ''}
          <button class="ml-3 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity tab-close-btn flex items-center" data-id="${t.id}">
            <i data-lucide="x" class="size-3.5"></i>
          </button>
        </div>
      `;
    }).join("");
    renderIcons(el);
  }

  updateBreadcrumbs() {
    const el = this.container.querySelector("#editor-breadcrumbs");
    if (!el) return;
    const { activeFileId, files } = fsStore.getState();
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = `<span>CompilerHub</span><i data-lucide="chevron-right" class="size-3.5 mx-2 text-muted-foreground/40"></i><span class="text-white/90">${activeFile.name}</span>`;
    renderIcons(el);
  }

  updateOptions() {
    if (this.editor) {
      const { fontSize, enableMinimap, wordWrap } = uiStore.getState();
      this.editor.updateOptions({ 
        fontSize,
        minimap: { enabled: enableMinimap },
        wordWrap: wordWrap ? "on" : "off"
      });
    }
    const val = this.container.querySelector("#font-size-val");
    if (val) val.textContent = uiStore.getState().fontSize;
  }

  updateMarkers() {
    if (!this.editor || !this.monaco) return;
    const { response, category } = compilerStore.getState();
    if (!response || category !== "problems") return;
    
    const diagnostics = compilerStore.allDiagnostics();
    const markers = diagnostics.map(d => ({
      startLineNumber: d.line,
      startColumn: 1,
      endLineNumber: d.line,
      endColumn: 100,
      message: d.message,
      severity: d.severity === 'error' ? 8 : 4
    }));
    
    this.monaco.editor.setModelMarkers(this.editor.getModel(), "compiler", markers);
  }

  initMonaco() {
    if (window.monaco) {
      this.monaco = window.monaco;
      this.createEditor();
      return;
    }

    if (window.require) {
      window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      window.require(['vs/editor/editor.main'], () => {
        this.monaco = window.monaco;
        this.createEditor();
      });
    }
  }

  createEditor() {
    const container = this.container.querySelector("#monaco-container");
    if (!container) return;
    
    const { enableMinimap = true, wordWrap = true } = uiStore.getState();
    
    this.editor = this.monaco.editor.create(container, {
      value: fsStore.getState().activeContent || "",
      language: "c",
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: uiStore.getState().fontSize,
      minimap: { enabled: enableMinimap },
      wordWrap: wordWrap ? "on" : "off",
      padding: { top: 12 },
      folding: true,
      foldingHighlight: true,
      showFoldingControls: "always",
      renderLineHighlight: "line",
      lineNumbers: "on",
      roundedSelection: true,
      scrollBeyondLastLine: false,
      accessibilitySupport: "auto"
    });

    this.editor.onDidChangeModelContent(debounce(() => {
      fsStore.setContent(this.editor.getValue());
    }, 500));
  }

  syncEditorContent() {
    if (this.editor) {
      const current = this.editor.getValue();
      const target = fsStore.getState().activeContent || "";
      if (current !== target) {
        this.editor.setValue(target);
      }
    }
  }

  async handleRun() {
    const code = this.editor ? this.editor.getValue() : fsStore.getState().activeContent;
    try {
      await compilerStore.run(code);
    } catch (err) {
      console.error("Compilation failed:", err);
    }
  }

  bindEvents() {
    this.container.querySelector("#run-btn").onclick = () => this.handleRun();
    this.container.querySelector("#editor-font-inc").onclick = () => uiStore.fontInc();
    this.container.querySelector("#editor-font-dec").onclick = () => uiStore.fontDec();
    this.container.querySelector("#toggle-minimap-btn").onclick = () => uiStore.toggleMinimap();
    this.container.querySelector("#toggle-wordwrap-btn").onclick = () => uiStore.toggleWordWrap();

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") { e.preventDefault(); uiStore.fontInc(); }
        if (e.key === "-") { e.preventDefault(); uiStore.fontDec(); }
      }
    });
    
    this.container.querySelector("#editor-tabs").onclick = (e) => {
      const close = e.target.closest(".tab-close-btn");
      if (close) {
        e.stopPropagation();
        fsStore.closeTab(close.dataset.id);
        return;
      }
      const tab = e.target.closest("[data-id]");
      if (tab) fsStore.pinFile(tab.dataset.id);
    };
  }

  handleExport() {
    const { activeFileId, files, activeContent } = fsStore.getState();
    const activeFile = files.find(f => f.id === activeFileId);
    const code = activeContent || "";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile?.name || "code.c";
    a.click();
    URL.revokeObjectURL(url);
  }

  destroy() {
    super.destroy();
    if (this.editor) this.editor.dispose();
    if (this.unsubscribeUi) this.unsubscribeUi();
    if (this.unsubscribeCompiler) this.unsubscribeCompiler();
  }
}

import { compilerStore, CATEGORIES } from "../store/compilerStore.js";
import { uiStore } from "../store/uiStore.js";
import { renderIcons } from "../lib/utils.js";
import { toast } from "../lib/toast.js";
import { Component } from "../lib/system.js";

const PHASE_LABELS = {
  lexical: "Lexical",
  syntax: "Syntax",
  semantic: "Semantic",
  intermediate: "IR"
};

export class CompilationPanel extends Component {
  constructor(container) {
    super(container, compilerStore);
    this.compilationHistory = [];
    this.mount();
  }

  render() {
    this.container.innerHTML = `
      <section class="flex flex-col h-full bg-surface-1 border border-border rounded-lg overflow-hidden relative shadow-sm">
        <div id="comp-tabs-category" class="h-10 flex items-center bg-surface-0 border-b border-border/50 shrink-0 overflow-x-auto scrollbar-none px-2 justify-between">
          <div class="flex items-center gap-2"></div>
          <div class="flex items-center gap-2">
            <button id="export-comp-btn" class="flex items-center gap-1 h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors" title="Export compilation results">
              <i data-lucide="download" class="size-3.5"></i>
            </button>
            <button id="history-toggle-btn" class="flex items-center gap-1 h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors" title="Show compilation history">
              <i data-lucide="history" class="size-3.5"></i>
            </button>
          </div>
        </div>

        <div id="comp-timeline" class="h-8 flex items-center bg-surface-0 border-b border-border/30 px-4 gap-3 shrink-0 overflow-x-auto scrollbar-none hidden">
          <!-- Phase timeline visualization -->
        </div>
        
        <div id="comp-tabs-phase" class="h-9 flex items-center bg-surface-1 border-b border-border/50 px-3 gap-1.5 overflow-x-auto scrollbar-none hidden">
        </div>

        <div id="comp-body" class="flex-1 min-h-0 overflow-auto bg-terminal font-mono text-xs leading-[1.6] text-syntax-base scroll-strategy">
        </div>

        <div id="comp-history" class="hidden flex-1 min-h-0 overflow-auto bg-surface-1 border-t border-border p-4">
          <!-- History list -->
        </div>
      </section>
    `;
  }

  afterRender() {
    super.afterRender();
    this.update();
    this.bindEvents();
  }

  update() {
    this.renderCategories();
    this.renderPhases();
    this.renderTimeline();
    this.renderBody();
    renderIcons(this.container);
  }

  renderCategories() {
    const el = this.container.querySelector("#comp-tabs-category > div:first-child");
    if (!el) return;
    const { category } = compilerStore.getState();

    el.innerHTML = CATEGORIES.map(c => `
      <button class="relative h-full px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${category === c.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}" data-id="${c.id}">
        ${c.label}
        ${category === c.id ? '<div class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>' : ''}
      </button>
    `).join("");

    el.onclick = (e) => {
      const btn = e.target.closest("[data-id]");
      if (btn) {
        compilerStore.setCategory(btn.dataset.id);
        uiStore.addCommandHistory(`View ${btn.dataset.id} output`);
      }
    };
  }

  renderTimeline() {
    const el = this.container.querySelector("#comp-timeline");
    if (!el) return;
    const { category, response } = compilerStore.getState();
    const cat = CATEGORIES.find(c => c.id === category);

    if (cat?.hasPhases && response) {
      el.classList.remove("hidden");
      const phases = ["lexical", "syntax", "semantic", "intermediate"];
      el.innerHTML = phases.map((phase, idx) => {
        const hasData = response.data?.[phase]?.output?.length > 0;
        return `
          <div class="flex items-center gap-2">
            <div class="flex items-center justify-center size-6 rounded-full text-[10px] font-medium ${hasData ? 'bg-primary/30 text-primary border border-primary/50' : 'bg-surface-2 text-muted-foreground border border-border/50'}">
              ${idx + 1}
            </div>
            <span class="text-[10px] font-mono text-muted-foreground whitespace-nowrap">${phase}</span>
            ${idx < phases.length - 1 ? '<div class="w-6 h-px bg-border/50"></div>' : ''}
          </div>
        `;
      }).join("");
    } else {
      el.classList.add("hidden");
    }
  }

  renderPhases() {
    const el = this.container.querySelector("#comp-tabs-phase");
    if (!el) return;
    const { category, phase } = compilerStore.getState();
    const cat = CATEGORIES.find(c => c.id === category);

    if (cat?.hasPhases) {
      el.classList.remove("hidden");
      el.innerHTML = [
        { id: "lexical", name: "Lexical Analysis" },
        { id: "syntax", name: "Syntax Analysis" },
        { id: "semantic", name: "Semantic Analysis" },
        { id: "intermediate", name: "IR Generation" }
      ].map(p => `
        <button class="h-6 px-2.5 rounded-md text-[11px] transition-colors ${phase === p.id ? 'bg-surface-3 text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'}" data-phase="${p.id}">
          ${p.name}
        </button>
      `).join("");

      el.onclick = (e) => {
        const btn = e.target.closest("[data-phase]");
        if (btn) compilerStore.setPhase(btn.dataset.phase);
      };
    } else {
      el.classList.add("hidden");
    }
  }

  renderBody() {
    const el = this.container.querySelector("#comp-body");
    if (!el) return;
    const { isCompiling, response, category, phase } = compilerStore.getState();

    if (isCompiling) {
      el.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse gap-3">
          <i data-lucide="loader-2" class="size-5 animate-spin text-primary"></i>
          <span class="text-xs font-sans">Compiling workspace...</span>
        </div>`;
      renderIcons(el);
      return;
    }

    if (!response) {
      el.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-muted-foreground/50 select-none gap-2">
          <i data-lucide="terminal-square" class="size-8 mb-1 opacity-50"></i>
          <span class="text-xs font-medium font-sans text-muted-foreground">No output generated</span>
          <span class="text-[10px] font-sans">Press Ctrl+Enter or click Run to compile</span>
        </div>`;
      renderIcons(el);
      return;
    }

    // Problems view
    if (category === "problems") {
      const items = compilerStore.allDiagnostics();
      if (!items.length) {
        el.innerHTML = `
          <div class="flex items-center gap-2 p-6 text-success/90 font-sans text-xs">
            <i data-lucide="check-circle-2" class="size-4"></i>
            <span>No problems detected. Code compiled successfully!</span>
          </div>`;
        renderIcons(el);
        return;
      }
      
      const grouped = {};
      items.forEach(d => {
        if (!grouped[d.phase]) grouped[d.phase] = [];
        grouped[d.phase].push(d);
      });

      el.innerHTML = `<ul class="py-2">${Object.entries(grouped).map(([phaseKey, diagnostics]) => `
        <li class="border-b border-border/30 last:border-b-0">
          <div class="px-4 py-2 bg-surface-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">${phaseKey}</div>
          ${diagnostics.map(d => `
            <div class="group px-4 py-3 hover:bg-white/5 transition-colors border-l-2 ${d.severity === 'error' ? 'border-syntax-error' : 'border-syntax-warning'}">
              <div class="flex items-start gap-3">
                <span class="${d.severity === 'error' ? 'text-syntax-error' : 'text-syntax-warning'} font-bold uppercase tracking-widest text-[10px] w-12 shrink-0 pt-0.5">${d.severity}</span>
                <div class="flex flex-col gap-1.5 flex-1">
                  <span class="text-foreground/90 font-medium">${d.message}</span>
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-[11px] text-muted-foreground font-mono bg-surface-2 px-2 py-0.5 rounded">Line ${d.line}</span>
                    ${d.code ? `<span class="text-[11px] text-muted-foreground">Code: ${d.code}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </li>
      `).join('')}</ul>`;
      renderIcons(el);
      return;
    }

    // Output view
    const pd = response.data[phase] || { output: [] };
    const output = Array.isArray(pd.output) ? pd.output.join("\n") : pd.output || "";
    
    if (!output) {
      el.innerHTML = `<div class="p-4 text-muted-foreground/50 text-xs">No output from ${phase} phase</div>`;
      return;
    }

    el.innerHTML = `
      <div class="p-4">
        <div class="text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-syntax-base">
          <div class="text-syntax-comment mb-2">// ${phase.charAt(0).toUpperCase() + phase.slice(1)} Analysis Output</div>
          ${this.highlightOutput(output)}
        </div>
      </div>
    `;
    renderIcons(el);
  }

  highlightOutput(text) {
    // Basic syntax highlighting for compiler output
    return text
      .split("\n")
      .map((line, idx) => {
        if (line.includes("error") || line.includes("Error")) {
          return `<div class="text-syntax-error">${this.escapeHtml(line)}</div>`;
        }
        if (line.includes("warning") || line.includes("Warning")) {
          return `<div class="text-syntax-warning">${this.escapeHtml(line)}</div>`;
        }
        if (line.startsWith("//") || line.startsWith("/*")) {
          return `<div class="text-syntax-comment">${this.escapeHtml(line)}</div>`;
        }
        return `<div>${this.escapeHtml(line)}</div>`;
      })
      .join("");
  }

  escapeHtml(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  exportResults() {
    const { response, category } = compilerStore.getState();
    if (!response) return;

    const timestamp = new Date().toLocaleString();
    const content = {
      timestamp,
      category,
      diagnostics: compilerStore.allDiagnostics(),
      output: response.data
    };

    const json = JSON.stringify(content, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compilation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Compilation results exported");
  }

  bindEvents() {
    const exportBtn = this.container.querySelector("#export-comp-btn");
    const historyBtn = this.container.querySelector("#history-toggle-btn");
    const bodyEl = this.container.querySelector("#comp-body");
    const historyEl = this.container.querySelector("#comp-history");

    if (exportBtn) {
      exportBtn.onclick = () => this.exportResults();
    }

    if (historyBtn) {
      historyBtn.onclick = () => {
        const hidden = historyEl.classList.toggle("hidden");
        bodyEl.classList.toggle("hidden");
        uiStore.toggleCompilationHistory();
      };
    }
  }
}

    
    // Output Structure
    if (category === "output") {
      if (phase === "syntax") {
        el.innerHTML = `<div class="p-4">${this.renderAst(pd.output)}</div>`;
        renderIcons(el);
      } else if (phase === "intermediate") {
        const tac = typeof pd.output === 'string' ? pd.output : JSON.stringify(pd.output, null, 2);
        el.innerHTML = `<pre class="p-5 leading-relaxed text-foreground/80">${tac}</pre>`;
      } else {
        const content = JSON.stringify(pd.output, null, 2);
        el.innerHTML = `<pre class="p-5 leading-relaxed text-foreground/80">${content}</pre>`;
      }
    } else if (category === "error") {
      const items = pd.errors || [];
      el.innerHTML = `<pre class="p-5 leading-relaxed text-syntax-error">${items.map(i => `[Line ${i.line}] ${i.message}`).join("\n") || "No errors detected in this phase."}</pre>`;
    } else if (category === "warning") {
      const items = pd.warnings || [];
      el.innerHTML = `<pre class="p-5 leading-relaxed text-syntax-warning">${items.map(i => `[Line ${i.line}] ${i.message}`).join("\n") || "No warnings detected in this phase."}</pre>`;
    }
  }

  renderAst(node) {
    if (!node) return "";
    return `
      <div class="ast-node py-0.5">
        <div class="flex items-center gap-2 group cursor-default">
          <i data-lucide="${node.children ? 'chevron-down' : 'circle'}" class="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"></i>
          <span class="text-syntax-keyword">${node.type}</span>
          <span class="text-syntax-base font-bold">${node.value || ""}</span>
        </div>
        ${node.children ? `
          <div class="ml-[0.4rem] border-l border-white/10 pl-4 mt-1 flex flex-col gap-1">
             ${node.children.map(c => this.renderAst(c)).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }
}
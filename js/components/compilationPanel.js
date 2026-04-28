import { compilerStore, CATEGORIES } from "../store/compilerStore.js";
import { renderIcons } from "../lib/utils.js";
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
    this.mount();
  }

  render() {
    this.container.innerHTML = `
      <section class="flex flex-col h-full bg-surface-1 border border-border rounded-lg overflow-hidden relative shadow-sm">
        <div id="comp-tabs-category" class="h-10 flex items-center bg-surface-0 border-b border-border/50 shrink-0 overflow-x-auto scrollbar-none px-2">
          </div>
        
        <div id="comp-tabs-phase" class="h-9 flex items-center bg-surface-1 border-b border-border/50 px-3 gap-1.5 overflow-x-auto scrollbar-none hidden">
          </div>

        <div id="comp-body" class="flex-1 min-h-0 overflow-auto bg-terminal font-mono text-xs leading-[1.6] text-syntax-base scroll-strategy">
          </div>
      </section>
    `;
  }

  afterRender() {
    super.afterRender();
    this.update();
  }

  update() {
    this.renderCategories();
    this.renderPhases();
    this.renderBody();
    renderIcons(this.container);
  }

  renderCategories() {
    const el = this.container.querySelector("#comp-tabs-category");
    if (!el) return;
    const { category } = compilerStore.getState();

    // Primary Tabs: Strict typography, clear bottom-border active state
    el.innerHTML = CATEGORIES.map(c => `
      <button class="relative h-full px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors ${category === c.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}" data-id="${c.id}">
        ${c.label}
        ${category === c.id ? '<div class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>' : ''}
      </button>
    `).join("");

    el.onclick = (e) => {
      const btn = e.target.closest("[data-id]");
      if (btn) compilerStore.setCategory(btn.dataset.id);
    };
  }

  renderPhases() {
    const el = this.container.querySelector("#comp-tabs-phase");
    if (!el) return;
    const { category, phase } = compilerStore.getState();
    const cat = CATEGORIES.find(c => c.id === category);

    if (cat?.hasPhases) {
      el.classList.remove("hidden");
      // Secondary Tabs: Pill style, subdued colors to avoid competing with primary tabs
      el.innerHTML = [
        { id: "lexical", name: "Lexical" },
        { id: "syntax", name: "Syntax" },
        { id: "semantic", name: "Semantic" },
        { id: "intermediate", name: "IR" }
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

    // Proper Empty States
    if (isCompiling) {
      el.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse gap-3">
          <i data-lucide="loader-2" class="size-5 animate-spin text-primary"></i>
          <span class="text-xs font-sans">Compiling workspace...</span>
        </div>`;
      return;
    }

    if (!response) {
      el.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-muted-foreground/50 select-none gap-2">
          <i data-lucide="terminal-square" class="size-8 mb-1 opacity-50"></i>
          <span class="text-xs font-medium font-sans text-muted-foreground">No output generated</span>
          <span class="text-[10px] font-sans">Run the compiler to view diagnostic data</span>
        </div>`;
      return;
    }

    // Diagnostic Structure
    if (category === "problems") {
      const items = compilerStore.allDiagnostics();
      if (!items.length) {
        el.innerHTML = `
          <div class="flex items-center gap-2 p-6 text-success/90 font-sans text-xs">
            <i data-lucide="check-circle-2" class="size-4"></i>
            <span>No problems detected. Workspace is clean.</span>
          </div>`;
        return;
      }
      
      // Structured log layout with left-border severity indicators
      el.innerHTML = `<ul class="py-2">${items.map(d => `
        <li class="group px-4 py-2.5 hover:bg-white/5 transition-colors border-l-2 ${d.severity === 'error' ? 'border-syntax-error' : 'border-syntax-warning'}">
          <div class="flex items-start gap-3">
            <span class="${d.severity === 'error' ? 'text-syntax-error' : 'text-syntax-warning'} font-bold uppercase tracking-widest text-[10px] w-12 shrink-0 pt-0.5">${d.severity}</span>
            <div class="flex flex-col gap-1">
              <span class="text-foreground/90 font-medium">${d.message}</span>
              <div class="flex items-center gap-2 text-[11px] text-muted-foreground font-sans">
                <span>Phase: ${d.phase}</span>
                <span class="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                <span>Line ${d.line}</span>
              </div>
            </div>
          </div>
        </li>
      `).join("")}</ul>`;
      return;
    }

    const pd = response.data[phase] || { output: [] };
    
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
import { compilerStore, CATEGORIES } from "../store/compilerStore.js";
import { renderIcons, cn } from "../lib/utils.js";
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
      <section class="flex flex-col h-full bg-surface-1 border border-border rounded-lg overflow-hidden relative">
        <div id="comp-tabs-category" class="h-9 flex items-center bg-surface-0 border-b border-white/5 shrink-0 overflow-x-auto scrollbar-none">
          <!-- Categories -->
        </div>
        
        <div id="comp-tabs-phase" class="h-8 flex items-center bg-surface-1 border-b border-white/5 px-2 gap-1 overflow-x-auto scrollbar-none hidden">
          <!-- Phases -->
        </div>

        <div id="comp-body" class="flex-1 min-h-0 overflow-auto bg-[#0a0d18] font-mono text-xs leading-[1.6] text-syntax-base scroll-strategy">
          <!-- Body -->
        </div>
      </section>
    `;
  }

  afterRender() {
    super.afterRender();
    this.update();
    renderIcons(this.container);
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

    el.innerHTML = CATEGORIES.map(c => `
      <button class="h-full px-5 text-[11px] font-mono uppercase tracking-widest transition-all ${category === c.id ? 'bg-[#151926] text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-white'}" data-id="${c.id}">
        ${c.label}
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
      // PHASES are lexical, syntax, semantic, intermediate
      el.innerHTML = [
        { id: "lexical", name: "Lexical" },
        { id: "syntax", name: "Syntax" },
        { id: "semantic", name: "Semantic" },
        { id: "intermediate", name: "IR" }
      ].map(p => `
        <button class="h-6 px-3 rounded text-[11px] font-mono whitespace-nowrap transition-colors ${phase === p.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}" data-phase="${p.id}">
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
    const phaseLabel = PHASE_LABELS[phase] || phase;

    if (isCompiling) {
      el.innerHTML = `<div class="p-6 text-foreground font-mono text-xs flex shadow-sm animate-pulse">
        <span class="mr-2 text-[#4ade80]">&gt;</span>
        <span>waiting for compile &ndash; showing ${category} / ${phaseLabel}</span>
      </div>`;
      return;
    }

    if (!response) {
      el.innerHTML = `<div class="p-7 text-muted-foreground font-mono text-xs flex">
        <span class="mr-2 text-[#4ade80]">&gt;</span>
        <span>waiting for compile &ndash; showing ${category} / ${phaseLabel}</span>
      </div>`;
      return;
    }

    if (category === "problems") {
      const items = compilerStore.allDiagnostics();
      if (!items.length) {
        el.innerHTML = `<div class="p-8 text-success italic">No problems detected. Workspace is clean.</div>`;
        return;
      }
      el.innerHTML = `<ul class="py-2">${items.map(d => `
        <li class="px-4 py-2 hover:bg-surface-2 transition-colors border-b border-white/5">
          <div class="flex items-center gap-2 text-xs">
            <span class="${d.severity === 'error' ? 'text-syntax-error' : 'text-syntax-warning'} font-bold uppercase tracking-widest text-[10px]">${d.severity}</span>
            <span class="text-muted-foreground">in ${d.phase}</span>
            <span class="text-muted-foreground ml-auto">Line ${d.line}</span>
          </div>
          <div class="mt-1 text-foreground">${d.message}</div>
        </li>
      `).join("")}</ul>`;
      return;
    }

    // pd.data contains { lexical, syntax, semantic, intermediate }
    const pd = response.data[phase] || { output: [] };
    
    if (category === "output") {
      if (phase === "syntax") {
        el.innerHTML = `<div class="p-4">${this.renderAst(pd.output)}</div>`;
        renderIcons(el);
      } else if (phase === "intermediate") {
        const tac = typeof pd.output === 'string' ? pd.output : JSON.stringify(pd.output, null, 2);
        el.innerHTML = `<pre class="p-4">${tac}</pre>`;
      } else {
        const content = JSON.stringify(pd.output, null, 2);
        el.innerHTML = `<pre class="p-4">${content}</pre>`;
      }
    } else if (category === "error") {
      const items = pd.errors || [];
      el.innerHTML = `<pre class="p-4 text-syntax-error">${items.map(i => `Line ${i.line}: ${i.message}`).join("\n") || "No errors in this phase."}</pre>`;
    } else if (category === "warning") {
      const items = pd.warnings || [];
      el.innerHTML = `<pre class="p-4 text-syntax-warning">${items.map(i => `Line ${i.line}: ${i.message}`).join("\n") || "No warnings in this phase."}</pre>`;
    }
  }


  renderAst(node) {
    if (!node) return "";
    return `
      <div class="ast-node p-0.5">
        <div class="flex items-center gap-2 group">
          <i data-lucide="${node.children ? 'chevron-down' : 'circle'}" class="size-3 text-muted-foreground/40"></i>
          <span class="text-syntax-keyword">${node.type}</span>
          <span class="text-syntax-base font-bold">${node.value || ""}</span>
        </div>
        ${node.children ? `
          <div class="ml-4 border-l border-white/5 pl-2 mt-1 flex flex-col gap-1">
             ${node.children.map(c => this.renderAst(c)).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }
}

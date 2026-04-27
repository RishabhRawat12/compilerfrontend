import { compilerStore, PHASES } from "../store/compilerStore.js";
import { renderIcons } from "../lib/utils.js";

const CATEGORIES = [
  { id: "problems", label: "Problems" },
  { id: "output", label: "Output" },
  { id: "warning", label: "Warnings" },
  { id: "error", label: "Errors" }
];

const PHASE_LABELS = {
  lexical: "Lexical",
  syntax: "Syntax",
  semantic: "Semantic",
import { compilerStore, CATEGORIES } from "../store/compilerStore.js";
import { renderIcons, cn } from "../lib/utils.js";
import { Component } from "../lib/system.js";

export class CompilationPanel extends Component {
  constructor(container) {
    super(container, compilerStore);
    this.mount();
  }

  render() {
    this.container.innerHTML = `
      <section class="flex flex-col h-full bg-surface-1 border border-border rounded-lg overflow-hidden relative">
        <div id="comp-tabs-category" class="h-9 flex items-center bg-surface-0 border-b border-border px-1 shrink-0 gap-0.5 overflow-x-auto scrollbar-none">
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
  }

  update() {
    this.renderCategories();
    this.renderPhases();
    this.renderBody();
  }

  renderCategories() {
    const el = this.container.querySelector("#comp-tabs-category");
    const { category } = compilerStore.getState();

    el.innerHTML = CATEGORIES.map(c => `
      <button class="h-full px-3 text-[11px] font-mono transition-colors ${category === c.id ? 'bg-surface-1 text-primary' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'}" data-id="${c.id}">
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
    const { category, phaseId, response } = compilerStore.getState();
    const cat = CATEGORIES.find(c => c.id === category);

    if (cat?.hasPhases && response) {
      el.classList.remove("hidden");
      const phases = response[category] || [];
      el.innerHTML = phases.map(p => `
        <button class="h-6 px-3 rounded-md text-[10px] whitespace-nowrap transition-colors ${phaseId === p.id ? 'bg-primary text-white font-bold shadow-sm shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}" data-phase="${p.id}">
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
      const items = compilerStore.allDiagnostics();
      if (!items.length) {
        body.innerHTML = `<div class="px-4 py-4"><span class="text-success">❯</span> <span class="text-success ml-2">no problems detected</span></div>`;
        return;
      }
      body.innerHTML = `<ul class="py-1">` + items.map(d => {
        const icon = d.severity === "error" ? "alert-circle" : "alert-triangle";
        const color = d.severity === "error" ? "text-syntax-error hover:bg-destructive/15" : "text-syntax-warning hover:bg-warning/15";
        return `
          <li>
            <button class="w-full text-left flex items-center gap-3 px-4 py-1.5 transition-colors ${color}" onclick="window.compilationJump(${d.line}, '${d.phase}')">
              <i data-lucide="${icon}" class="size-3.5 shrink-0"></i>
              <span class="text-2xs uppercase tracking-wider opacity-70 w-14 shrink-0">${PHASE_LABELS[d.phase]}</span>
              <span class="text-subtle-foreground select-none w-12 text-right shrink-0 font-mono">${d.line}:</span>
              <span class="flex-1 break-words">${d.message}</span>
            </button>
          </li>
        `;
      }).join("") + `</ul>`;
    } 
    else if (s.category === "error" || s.category === "warning") {
      const items = s.category === "error" ? compilerStore.errorsByPhase(s.phase) : compilerStore.warningsByPhase(s.phase);
      if (!items.length) {
        body.innerHTML = `<div class="px-4 py-4"><span class="text-success">❯</span> <span class="text-muted-foreground italic ml-2">no ${s.category}s in ${PHASE_LABELS[s.phase].toLowerCase()} phase</span></div>`;
        return;
      }
      const tag = s.category === "error" ? "error" : "warning";
      const color = s.category === "error" ? "text-syntax-error hover:bg-destructive/15" : "text-syntax-warning hover:bg-warning/15";
      body.innerHTML = `<ul class="py-1">` + items.map(d => `
        <li>
          <button class="w-full text-left flex gap-3 px-4 py-1.5 transition-colors ${color}" onclick="window.compilationJump(${d.line}, '${s.phase}')">
            <span class="text-subtle-foreground select-none w-12 text-right shrink-0">${d.line}:</span>
            <span class="opacity-70 uppercase text-2xs tracking-wider mt-[2px] shrink-0">${tag}</span>
            <span class="flex-1 break-words">${d.message}</span>
          </button>
        </li>
      `).join("") + `</ul>`;
    } 
    else if (s.category === "output") {
      this.renderOutputPhase(body, s.phase, s.response.data[s.phase]);
    }

    renderIcons(body);

    // Expose jump globally just for ease of HTML string inline handlers
    window.compilationJump = jumpToLine;
  }

  renderOutputPhase(body, phase, data) {
    if (phase === "lexical") {
      const tokens = (data?.output) || [];
      if (!tokens.length) {
        body.innerHTML = `<div class="px-4 py-4"><span class="text-success">❯</span> <span class="text-muted-foreground italic ml-2">no lexical tokens produced</span></div>`;
        return;
      }
      body.innerHTML = `
        <div class="px-4 py-3">
          <div class="text-syntax-fn mb-2">// ${tokens.length} tokens</div>
          ${tokens.map(t => `
            <button class="w-full text-left flex gap-3 hover:bg-surface-2 px-1 transition-colors" 
              onclick="window.compilationJump(${t.line})"
              onmouseenter="window.dispatchEvent(new CustomEvent('compilerhub:highlight-line', { detail: { line: ${t.line} } }))"
              onmouseleave="window.dispatchEvent(new CustomEvent('compilerhub:highlight-line', { detail: { line: 0 } }))"
            >
              <span class="text-subtle-foreground select-none w-10 text-right">${t.line}</span>
              <span class="text-syntax-keyword w-28 truncate">${t.type}</span>
              <span class="text-syntax-string">${t.lexeme}</span>
            </button>
          `).join("")}
        </div>
      `;
    } 
    else if (phase === "semantic") {
      const rows = data?.output || [];
      if (!rows.length) {
        body.innerHTML = `<div class="px-4 py-4"><span class="text-success">❯</span> <span class="text-muted-foreground italic ml-2">symbol table is empty</span></div>`;
        return;
      }
      body.innerHTML = `
        <div class="px-4 py-3">
          <div class="text-syntax-fn mb-2">// symbol table — ${rows.length} entries</div>
          <div class="grid grid-cols-[3rem_1fr_1fr_1fr] gap-x-3 text-xs-tight text-subtle-foreground mb-1 px-1">
            <span class="text-right">line</span><span>name</span><span>type</span><span>scope</span>
          </div>
          ${rows.map(r => `
            <div class="grid grid-cols-[3rem_1fr_1fr_1fr] gap-x-3 hover:bg-surface-2 px-1">
              <span class="text-subtle-foreground text-right">${r.line || "—"}</span>
              <span class="text-foreground">${r.name}</span>
              <span class="text-syntax-type">${r.type}</span>
              <span class="text-muted-foreground">${r.scope || "—"}</span>
            </div>
          `).join("")}
        </div>
      `;
    }
    else if (phase === "intermediate") {
      const tac = String(data?.output || "").trim();
      if (!tac) {
        body.innerHTML = `<div class="px-4 py-4"><span class="text-success">❯</span> <span class="text-muted-foreground italic ml-2">no intermediate code produced</span></div>`;
        return;
      }
      const lines = tac.split("\\n");
      body.innerHTML = `
        <div class="px-4 py-3">
          <div class="text-syntax-fn mb-2">// three-address code</div>
          ${lines.map((l, i) => `
            <div class="flex gap-3 hover:bg-surface-2 px-1">
              <span class="text-subtle-foreground select-none w-10 text-right">${i + 1}</span>
              <span class="whitespace-pre">${l}</span>
            </div>
          `).join("")}
        </div>
      `;
    }
    else if (phase === "syntax") {
      const value = data?.output;
      const empty = value == null || (typeof value === "object" && Object.keys(value).length === 0);
      if (empty) {
        body.innerHTML = `<div class="px-4 py-4"><span class="text-success">❯</span> <span class="text-muted-foreground italic ml-2">no syntax tree produced</span></div>`;
        return;
      }
      body.innerHTML = `
        <div class="px-4 py-3 pb-8">
          <div class="flex items-center gap-1 mb-3">
            <button id="ast-mode-tree" class="h-6 px-2 rounded text-xs-tight font-mono transition-colors ${this.astMode === 'tree' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-surface-2'}">Tree</button>
            <button id="ast-mode-json" class="h-6 px-2 rounded text-xs-tight font-mono transition-colors ${this.astMode === 'json' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-surface-2'}">JSON</button>
          </div>
          <div id="ast-container"></div>
        </div>
      `;

      const astContainer = body.querySelector("#ast-container");
      
      const renderAst = () => {
        astContainer.innerHTML = "";
        if (this.astMode === "tree") {
          const root = this.toAstNode(value, "program");
          astContainer.appendChild(this.createAstBranchDOM(root, 0));
        } else {
          astContainer.appendChild(this.createJsonNodeDOM(value, "root", 0));
        }
      };

      body.querySelector("#ast-mode-tree").addEventListener("click", () => {
        this.astMode = "tree";
        this.updateView(); // brute re-render simplifies things initially
      });
      body.querySelector("#ast-mode-json").addEventListener("click", () => {
        this.astMode = "json";
        this.updateView();
      });

      renderAst();
    }
  }

  // AST Logic
  toAstNode(value, name) {
    if (value === null || value === undefined) {
      return { label: name, detail: String(value), children: [] };
    }
    if (Array.isArray(value)) {
      return {
        label: name,
        detail: `[${value.length}]`,
        children: value.map((v, i) => this.toAstNode(v, `${i}`)),
      };
    }
    if (typeof value === "object") {
      const typeField = typeof value.type === "string" ? value.type : null;
      const label = typeField ? `${typeField}` : name;
      const detail = typeField && name !== "root" ? name : undefined;
      return {
        label,
        detail,
        children: Object.entries(value).filter(([k]) => k !== "type").map(([k, v]) => this.toAstNode(v, k)),
      };
    }
    return { label: name, detail: JSON.stringify(value), children: [] };
  }

  createAstBranchDOM(node, depth) {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-start";
    
    // Check initial state locally, open folders slightly deep
    let stateOpen = depth < 3;
    const hasChildren = node.children.length > 0;
    
    const btn = document.createElement("button");
    btn.className = `inline-flex items-center gap-1.5 px-2 py-1 rounded border bg-surface-2 mb-1.5 border-border-strong text-xs-tight font-mono whitespace-nowrap ${hasChildren ? "hover:border-primary/50 cursor-pointer" : "cursor-default"}`;
    
    btn.innerHTML = `
      ${hasChildren 
        ? `<i data-lucide="chevron-right" class="size-3 transition-transform ${stateOpen ? 'rotate-90' : ''}"></i>` 
        : `<span class="size-1.5 rounded-full bg-syntax-string ml-0.5"></span>`
      }
      <span class="text-syntax-keyword">${node.label}</span>
      ${node.detail ? `<span class="text-muted-foreground">· ${node.detail}</span>` : ""}
    `;
    wrapper.appendChild(btn);

    const childrenContainer = document.createElement("div");
    childrenContainer.className = "flex items-stretch ml-4 mt-1 pl-4 border-l border-border gap-3";
    
    if (hasChildren) {
      const cWrapper = document.createElement("div");
      cWrapper.className = "flex flex-col gap-1";
      node.children.forEach(c => cWrapper.appendChild(this.createAstBranchDOM(c, depth + 1)));
      childrenContainer.appendChild(cWrapper);
      
      btn.addEventListener("click", () => {
        stateOpen = !stateOpen;
        const icon = btn.querySelector("i");
        if (stateOpen) {
          icon.classList.add("rotate-90");
          childrenContainer.classList.remove("hidden");
        } else {
          icon.classList.remove("rotate-90");
          childrenContainer.classList.add("hidden");
        }
      });
      
      if (!stateOpen) childrenContainer.classList.add("hidden");
      wrapper.appendChild(childrenContainer);
    }

    renderIcons(btn);
    return wrapper;
  }

  createJsonNodeDOM(value, name, depth) {
    const wrapper = document.createElement("div");
    wrapper.style.paddingLeft = `${depth * 14}px`;
    const isObj = value !== null && typeof value === "object";

    if (!isObj) {
      wrapper.innerHTML = `<span class="text-syntax-fn">${name}</span><span class="text-muted-foreground">: </span><span class="text-syntax-string">${JSON.stringify(value)}</span>`;
      return wrapper;
    }

    const entries = Object.entries(value);
    let stateOpen = depth < 2;

    const btn = document.createElement("button");
    btn.className = "inline-flex items-center gap-1 text-foreground hover:text-primary";
    btn.innerHTML = `<i data-lucide="chevron-right" class="size-3 transition-transform ${stateOpen ? 'rotate-90' : ''}"></i><span class="text-syntax-keyword">${name}</span><span class="text-muted-foreground">${Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span>`;
    wrapper.appendChild(btn);

    const childrenContainer = document.createElement("div");
    if (!stateOpen) childrenContainer.classList.add("hidden");
    
    entries.forEach(([k, v]) => childrenContainer.appendChild(this.createJsonNodeDOM(v, k, depth + 1)));
    wrapper.appendChild(childrenContainer);

    btn.addEventListener("click", () => {
      stateOpen = !stateOpen;
      const icon = btn.querySelector("i");
      if (stateOpen) {
        icon.classList.add("rotate-90");
        childrenContainer.classList.remove("hidden");
      } else {
        icon.classList.remove("rotate-90");
        childrenContainer.classList.add("hidden");
      }
    });

    renderIcons(btn);
    return wrapper;
  }

  bindEvents() {
    this.container.addEventListener("click", (e) => {
      const cTab = e.target.closest(".compilation-tab");
      if (cTab) {
        compilerStore.setCategory(cTab.getAttribute("data-tab"));
      }

      const pTab = e.target.closest(".phase-tab");
      if (pTab) {
        compilerStore.setPhase(pTab.getAttribute("data-phase"));
      }
    });
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    this.container.innerHTML = "";
  }
}

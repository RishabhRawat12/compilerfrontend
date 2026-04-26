import { Store } from "./store.js";
import { api } from "../lib/api.js";

const empty = () => ({ output: [], warnings: [], errors: [] });

function normalizeCompileResponse(raw) {
  if (raw && raw.data && raw.data.lexical && raw.data.intermediate) {
    return raw;
  }
  const safe = raw || {};
  return {
    success: !safe.error,
    data: {
      lexical: { ...empty(), output: safe.lexical || [] },
      syntax: { ...empty(), output: safe.syntax || {} },
      semantic: { ...empty(), output: safe.semantic || [] },
      intermediate: {
        ...empty(),
        output: safe.intermediate || safe.compiler_logs || "",
        errors: safe.error ? [{ line: 0, message: String(safe.error) }] : [],
      },
    },
  };
}

export const PHASES = ["lexical", "syntax", "semantic", "intermediate"];

class CompilerStore extends Store {
  constructor() {
    super({
      isCompiling: false,
      response: null,
      category: "output", // problems, output, warning, error
      phase: "lexical",
    });
  }

  setCategory(category) {
    this.setState({ category });
  }

  setPhase(phase) {
    this.setState({ phase });
  }

  reset() {
    this.setState({ response: null });
  }

  async run(code) {
    this.setState({ isCompiling: true });
    try {
      const { data } = await api.post("/api/compile", { code });
      this.setState({ response: normalizeCompileResponse(data) });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message;
      this.setState({
        response: normalizeCompileResponse({
          error: msg || "Compilation request failed",
        }),
      });
      throw err;
    } finally {
      this.setState({ isCompiling: false });
    }
  }

  totalErrors() {
    const r = this.getState().response;
    if (!r) return 0;
    return PHASES.reduce((n, p) => n + (r.data[p]?.errors?.length || 0), 0);
  }

  totalWarnings() {
    const r = this.getState().response;
    if (!r) return 0;
    return PHASES.reduce((n, p) => n + (r.data[p]?.warnings?.length || 0), 0);
  }

  errorsByPhase(phase) {
    const r = this.getState().response;
    if (!r) return [];
    return (r.data[phase]?.errors || []).map((d) => ({ ...d, phase }));
  }

  warningsByPhase(phase) {
    const r = this.getState().response;
    if (!r) return [];
    return (r.data[phase]?.warnings || []).map((d) => ({ ...d, phase }));
  }

  allDiagnostics() {
    const r = this.getState().response;
    if (!r) return [];
    const out = [];
    for (const p of PHASES) {
      for (const e of r.data[p]?.errors || []) {
        out.push({ ...e, phase: p, severity: "error" });
      }
      for (const w of r.data[p]?.warnings || []) {
        out.push({ ...w, phase: p, severity: "warning" });
      }
    }
    return out.sort((a, b) => a.line - b.line);
  }
}

export const compilerStore = new CompilerStore();

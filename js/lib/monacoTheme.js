export const COMPILERHUB_THEME = "compilerhub-dark";

export function defineCompilerHubTheme(monaco) {
  // Pull computed CSS variable values dynamically or use known hex values
  const getVar = (name, fallback) => {
    // Basic mapping since definedTheme needs hex codes, not CSS variable references directly (it can't resolve raw CSS vars for standard token arrays)
    // Here we hardcode the hex mapping of our HSL tokens for Monaco's strict token model.
    const map = {
      keyword: "#bb9af7",
      fn: "#7aa2f7",
      string: "#9ece6a",
      type: "#2ac3de",
      number: "#ff9e64",
      error: "#f7768e",
      warning: "#e0af68",
      comment: "#565f89",
      punct: "#89ddff",
      base: "#c0caf5",
      bg: "#0b1020" // terminal/editor bg
    };
    return map[name] || fallback;
  };

  monaco.editor.defineTheme(COMPILERHUB_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: getVar("base").substring(1), background: getVar("bg").substring(1) },
      { token: "keyword", foreground: getVar("keyword").substring(1) },
      { token: "type", foreground: getVar("type").substring(1) },
      { token: "number", foreground: getVar("number").substring(1) },
      { token: "string", foreground: getVar("string").substring(1) },
      { token: "comment", foreground: getVar("comment").substring(1), fontStyle: "italic" },
      { token: "identifier", foreground: getVar("base").substring(1) },
      { token: "function", foreground: getVar("fn").substring(1) },
      { token: "delimiter", foreground: getVar("punct").substring(1) },
      { token: "operator", foreground: getVar("punct").substring(1) },
    ],
    colors: {
      "editor.background": getVar("bg"),
      "editor.foreground": getVar("base"),
      "editor.lineHighlightBackground": "#ffffff0a",
      "editorCursor.foreground": "#7aa2f7",
      "editorWhitespace.foreground": "#ffffff1a",
      "editorIndentGuide.background": "#ffffff1a",
      "editorIndentGuide.activeBackground": "#ffffff33",
      "editorSuggestWidget.background": "#161b22",
      "editorSuggestWidget.border": "#30363d",
      "dropdown.background": "#161b22",
    },
  });
}

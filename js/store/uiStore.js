import { Store } from "./store.js";

class UiStore extends Store {
  constructor() {
    super({
      fontSize: 14,
      explorerCollapsed: false,
      layoutDir: "horizontal",
      commandPaletteOpen: false,
      enableMinimap: true,
      wordWrap: true,
      autoSave: true,
      autoSaveDelay: 5000,
      theme: "dark",
      accentColor: "primary",
      tabSize: 2,
      expandTabs: true,
      showLineNumbers: true,
      bracketAutoClose: true,
      commandHistory: [],
      searchFilesQuery: "",
      filtersExpanded: false,
      favorites: [],
      showCompilationHistory: false,
      compilerOptimization: "-O0",
      compilerFlags: "",
      cursorPosition: { line: 1, col: 1 },
      selectedTheme: "vs-dark"
    });
  }

  fontInc() {
    this.setState((s) => ({ fontSize: Math.min(s.fontSize + 1, 24) }));
  }

  fontDec() {
    this.setState((s) => ({ fontSize: Math.max(s.fontSize - 1, 8) }));
  }

  setExplorerCollapsed(collapsed) {
    this.setState({ explorerCollapsed: collapsed });
  }

  toggleExplorer() {
    this.setState((s) => ({ explorerCollapsed: !s.explorerCollapsed }));
  }

  setLayoutDir(dir) {
    this.setState({ layoutDir: dir });
  }

  toggleLayoutDir() {
    this.setState((s) => ({ layoutDir: s.layoutDir === "horizontal" ? "vertical" : "horizontal" }));
  }

  setCommandPaletteOpen(open) {
    this.setState({ commandPaletteOpen: open });
  }

  togglePalette() {
    this.setState((s) => ({ commandPaletteOpen: !s.commandPaletteOpen }));
  }

  toggleMinimap() {
    this.setState((s) => ({ enableMinimap: !s.enableMinimap }));
  }

  setMinimap(enabled) {
    this.setState({ enableMinimap: enabled });
  }

  toggleWordWrap() {
    this.setState((s) => ({ wordWrap: !s.wordWrap }));
  }

  setWordWrap(enabled) {
    this.setState({ wordWrap: enabled });
  }

  toggleAutoSave() {
    this.setState((s) => ({ autoSave: !s.autoSave }));
  }

  setAutoSave(enabled) {
    this.setState({ autoSave: enabled });
  }

  setAutoSaveDelay(delay) {
    this.setState({ autoSaveDelay: delay });
  }

  setTheme(theme) {
    this.setState({ theme });
    localStorage.setItem("app-theme", theme);
  }

  setAccentColor(color) {
    this.setState({ accentColor: color });
    localStorage.setItem("app-accent", color);
  }

  setTabSize(size) {
    this.setState({ tabSize: size });
    localStorage.setItem("tab-size", size);
  }

  toggleBracketAutoClose() {
    this.setState((s) => ({ bracketAutoClose: !s.bracketAutoClose }));
  }

  addCommandHistory(command) {
    this.setState((s) => ({
      commandHistory: [command, ...s.commandHistory.filter(c => c !== command)].slice(0, 50)
    }));
  }

  clearCommandHistory() {
    this.setState({ commandHistory: [] });
  }

  setCursorPosition(line, col) {
    this.setState({ cursorPosition: { line, col } });
  }

  addFavorite(fileId) {
    this.setState((s) => ({
      favorites: s.favorites.includes(fileId) ? s.favorites : [...s.favorites, fileId]
    }));
  }

  removeFavorite(fileId) {
    this.setState((s) => ({
      favorites: s.favorites.filter(id => id !== fileId)
    }));
  }

  setCompilerOptimization(level) {
    this.setState({ compilerOptimization: level });
    localStorage.setItem("compiler-opt", level);
  }

  setCompilerFlags(flags) {
    this.setState({ compilerFlags: flags });
    localStorage.setItem("compiler-flags", flags);
  }

  toggleCompilationHistory() {
    this.setState((s) => ({ showCompilationHistory: !s.showCompilationHistory }));
  }

  setSelectedTheme(theme) {
    this.setState({ selectedTheme: theme });
    localStorage.setItem("editor-theme", theme);
  }
}

export const uiStore = new UiStore();

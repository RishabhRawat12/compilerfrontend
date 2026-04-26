import { Store } from "./store.js";

class UiStore extends Store {
  constructor() {
    super({
      fontSize: 14,
      explorerCollapsed: false,
      layoutDir: "horizontal",
      commandPaletteOpen: false,
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
}

export const uiStore = new UiStore();

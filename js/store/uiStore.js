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

  setLayoutDir(dir) {
    this.setState({ layoutDir: dir });
  }

  setCommandPaletteOpen(open) {
    this.setState({ commandPaletteOpen: open });
  }
}

export const uiStore = new UiStore();

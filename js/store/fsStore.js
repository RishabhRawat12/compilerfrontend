import { Store } from "./store.js";
import { api } from "../lib/api.js";

function buildTree(files, folders) {
  const folderMap = new Map();
  folders.forEach((f) =>
    folderMap.set(f.id, {
      id: f.id,
      name: f.name,
      type: "folder",
      children: [],
    })
  );

  const roots = [];
  folders.forEach((f) => {
    const node = folderMap.get(f.id);
    if (f.parent_id && folderMap.has(f.parent_id)) {
      folderMap.get(f.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  files.forEach((file) => {
    const node = {
      id: file.id,
      name: file.name,
      type: "file",
      children: [],
    };
    if (file.folder_id && folderMap.has(file.folder_id)) {
      folderMap.get(file.folder_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sort = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

class FsStore extends Store {
  constructor() {
    super({
      files: [],
      folders: [],
      tree: [],
      activeFileId: null,
      activeContent: "",
      dirty: false,
      saving: false,
      loading: false,
      openTabs: [],
      previewTabId: null, // Italic preview tab
    });
  }

  async refresh() {
    this.setState({ loading: true });
    try {
      const { data } = await api.get("/api/fs/tree");
      const files = data.files || [];
      const folders = data.folders || [];
      const tree = buildTree(files, folders);
      const activeFileId = files.length > 0 ? files[0].id : null;
      const activeContent = files.length > 0 ? files[0].content : "";
      const openTabs = activeFileId ? [activeFileId] : [];
      
      this.setState({ files, folders, tree, activeFileId, activeContent, openTabs });
    } catch (e) {
      // Mock data for demo
      const mockFiles = [
        { id: "1", name: "main.c", content: "int main() {\n  return 0;\n}", folder_id: null },
        { id: "2", name: "utils.h", content: "// Utils header", folder_id: "f1" },
        { id: "3", name: "config.json", content: '{\n  "debug": true\n}', folder_id: null }
      ];
      const mockFolders = [
        { id: "f1", name: "include", parent_id: null }
      ];
      this.setState({ 
        files: mockFiles, 
        folders: mockFolders, 
        tree: buildTree(mockFiles, mockFolders),
        activeFileId: "1",
        activeContent: mockFiles[0].content,
        openTabs: ["1"]
      });
      console.warn("Backend not reachable, using mock fs tree for demonstration");
    } finally {
      this.setState({ loading: false });
    }
  }

  peekFile(id) {
    const file = this.state.files.find((f) => f.id === id);
    if (!file) return;
    
    this.setState((s) => {
      if (s.openTabs.includes(id) && s.previewTabId !== id) {
        return {
          activeFileId: id,
          activeContent: file.content || "",
          dirty: false,
        };
      }
      
      let nextTabs = s.openTabs.slice();
      if (s.previewTabId && s.previewTabId !== id) {
        nextTabs = nextTabs.filter((t) => t !== s.previewTabId);
      }
      if (!nextTabs.includes(id)) nextTabs.push(id);
      
      return {
        openTabs: nextTabs,
        previewTabId: id,
        activeFileId: id,
        activeContent: file.content || "",
        dirty: false,
      };
    });
  }

  pinFile(id) {
    const file = this.state.files.find((f) => f.id === id);
    if (!file) return;
    this.setState((s) => ({
      openTabs: s.openTabs.includes(id) ? s.openTabs : [...s.openTabs, id],
      previewTabId: s.previewTabId === id ? null : s.previewTabId,
      activeFileId: id,
      activeContent: file.content || "",
      dirty: false,
    }));
  }

  closeTab(id) {
    const s = this.getState();
    const idx = s.openTabs.indexOf(id);
    if (idx === -1) return;
    
    const next = s.openTabs.filter((t) => t !== id);
    let nextActive = s.activeFileId;
    let nextContent = s.activeContent;
    
    if (s.activeFileId === id) {
      const fallback = next[idx] || next[idx - 1] || null;
      nextActive = fallback;
      const f = fallback ? s.files.find((x) => x.id === fallback) : null;
      nextContent = f?.content || "";
    }
    
    this.setState({
      openTabs: next,
      previewTabId: s.previewTabId === id ? null : s.previewTabId,
      activeFileId: nextActive,
      activeContent: nextContent,
      dirty: nextActive === s.activeFileId ? s.dirty : false,
    });
  }

  setContent(content) {
    this.setState((s) => {
      const promoted = s.previewTabId && s.previewTabId === s.activeFileId
        ? { previewTabId: null }
        : {};
      return { activeContent: content, dirty: true, ...promoted };
    });
  }

  async saveActive() {
    const { activeFileId, activeContent } = this.getState();
    if (!activeFileId) return;
    
    this.setState({ saving: true });
    try {
      await api.put(`/api/fs/file/${activeFileId}`, { content: activeContent });
      this.setState((s) => ({
        files: s.files.map((f) =>
          f.id === activeFileId ? { ...f, content: activeContent } : f
        ),
        dirty: false,
      }));
    } catch {
      throw new Error("Failed to save");
    } finally {
      this.setState({ saving: false });
    }
  }

  async createFile(name, folderId) {
    await api.post("/api/fs/file", { name, folder_id: folderId, content: "" });
    await this.refresh();
  }

  async createFolder(name, parentId) {
    await api.post("/api/fs/folder", { name, parent_id: parentId });
    await this.refresh();
  }

  async rename(type, id, name) {
    await api.put(`/api/fs/${type}/${id}`, { name });
    await this.refresh();
  }

  async remove(type, id) {
    await api.delete(`/api/fs/${type}/${id}`);
    if (type === "file") {
      this.setState((s) => ({
        openTabs: s.openTabs.filter((t) => t !== id),
        previewTabId: s.previewTabId === id ? null : s.previewTabId,
        ...(s.activeFileId === id
          ? { activeFileId: null, activeContent: "", dirty: false }
          : {}),
      }));
    }
    await this.refresh();
  }
}

export const fsStore = new FsStore();
window.fsStoreInstance = fsStore; // Make globally accessible for command palette

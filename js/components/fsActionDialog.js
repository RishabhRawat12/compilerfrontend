import { fsStore } from "../store/fsStore.js";
import { renderIcons } from "../lib/utils.js";

export class FsActionDialog {
  constructor() {
    this.container = null;
    this.isOpen = false;
    this.type = 'file'; // 'file' or 'folder'
    this.parentId = null;
  }

  show(type = 'file', parentId = null) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.type = type;
    this.parentId = parentId;
    this.render();
    this.bindEvents();
  }

  hide() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }

  render() {
    this.container = document.createElement("div");
    this.container.className = "overlay flex items-center justify-center";
    
    const title = this.type === 'file' ? 'New file' : 'New folder';
    const description = `Enter a name for the new ${this.type}.`;
    const placeholder = this.type === 'file' ? 'main.c' : 'src';

    this.container.innerHTML = `
      <div class="modal-content max-w-[340px] bg-[#0d0f17] border-[#1e202f] rounded-[24px] p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
        <div class="mb-5">
          <h2 class="text-[20px] font-bold text-white leading-tight mb-1">${title}</h2>
          <p class="text-[13px] text-muted-foreground/60 leading-tight">${description}</p>
        </div>

        <div class="mb-5">
          <input type="text" id="fs-dialog-input" 
            class="w-full bg-[#05060b] border-2 border-[#7c3aed] rounded-[18px] px-4 py-3.5 text-[14px] text-white outline-none transition-all placeholder:text-muted-foreground/20" 
            placeholder="${placeholder}" autofocus>
        </div>

        <div class="flex justify-end items-center gap-2">
          <button id="fs-dialog-cancel" class="px-5 py-2.5 rounded-[14px] text-[13px] font-medium text-white border border-white/5 hover:bg-white/5 transition-all">Cancel</button>
          <button id="fs-dialog-create" class="px-7 py-2.5 rounded-[16px] text-[13px] font-bold bg-[#7c3aed] text-white shadow-lg shadow-primary/10 hover:bg-[#6d28d9] transition-all">Create</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    renderIcons(this.container);
    
    // Auto-focus input after render
    setTimeout(() => {
      const input = this.container.querySelector("#fs-dialog-input");
      if (input) input.focus();
    }, 10);
  }

  bindEvents() {
    const cancelBtn = this.container.querySelector("#fs-dialog-cancel");
    const createBtn = this.container.querySelector("#fs-dialog-create");
    const input = this.container.querySelector("#fs-dialog-input");

    const handleCreate = async () => {
      const name = input.value.trim();
      if (name) {
        try {
          if (this.type === 'file') {
            await fsStore.createFile(name, this.parentId);
          } else {
            await fsStore.createFolder(name, this.parentId);
          }
          this.hide();
        } catch (err) {
          console.error("Create failed", err);
        }
      }
    };

    cancelBtn.onclick = () => this.hide();
    createBtn.onclick = handleCreate;

    input.onkeydown = (e) => {
      if (e.key === 'Enter') handleCreate();
      if (e.key === 'Escape') this.hide();
    };

    this.container.onclick = (e) => {
      if (e.target === this.container) this.hide();
    };
  }
}

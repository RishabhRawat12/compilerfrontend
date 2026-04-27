import { getBaseURL, setBaseURL, DEFAULT_BASE_URL } from "../lib/api.js";
import { toast } from "../lib/toast.js";
import { renderIcons } from "../lib/utils.js";

export class SettingsDialog {
  constructor() {
    this.container = null;
    this.isOpen = false;
  }

  show() {
    if (this.isOpen) return;
    this.isOpen = true;
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
    const currentUrl = getBaseURL();
    this.container = document.createElement("div");
    this.container.className = "overlay";
    this.container.innerHTML = `
      <div class="modal-content max-w-md">
        <div class="flex flex-col gap-1 mb-6">
          <h2 class="text-lg font-semibold text-foreground">Backend Settings</h2>
          <p class="text-xs text-muted-foreground">Configure the connection to your compiler services.</p>
        </div>

        <div class="flex flex-col gap-4 mb-8">
          <div class="flex flex-col gap-2">
            <label for="baseURL" class="text-xs font-medium text-muted-foreground">Backend Base URL</label>
            <input type="text" id="baseURL" class="input" value="${currentUrl}" placeholder="${DEFAULT_BASE_URL}">
          </div>
          <p class="text-[11px] leading-relaxed text-muted-foreground/70">
            The Flask server hosting <code class="bg-surface-2 px-1 rounded">/api/auth</code>, 
            <code class="bg-surface-2 px-1 rounded">/api/fs</code>, and 
            <code class="bg-surface-2 px-1 rounded">/api/compile</code>.
          </p>
        </div>

        <div class="flex justify-end gap-3">
          <button id="settings-cancel" class="btn btn-ghost px-4 py-2 text-xs">Cancel</button>
          <button id="settings-save" class="btn btn-primary px-6 py-2 text-xs font-semibold shadow-lg shadow-primary/20">Save changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
    renderIcons(this.container);
  }

  bindEvents() {
    const cancelBtn = this.container.querySelector("#settings-cancel");
    const saveBtn = this.container.querySelector("#settings-save");
    const input = this.container.querySelector("#baseURL");

    cancelBtn.addEventListener("click", () => this.hide());
    
    saveBtn.addEventListener("click", () => {
      const url = input.value.trim().replace(/\/$/, "");
      setBaseURL(url || DEFAULT_BASE_URL);
      toast.success("Backend URL updated");
      this.hide();
    });

    // Close on overlay click
    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}

export const toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
    }
  },

  createToast(message, type = 'default') {
    this.init();
    if (!this.container) return;

    const el = document.createElement('div');
    el.className = `p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto flex items-center gap-3 w-80 max-w-[90vw]`;
    
    // Style by type using our CSS variables
    if (type === 'success') {
      el.style.backgroundColor = 'hsl(var(--surface-2))';
      el.style.borderColor = 'hsl(var(--success) / 0.3)';
    } else if (type === 'error') {
      el.style.backgroundColor = 'hsl(var(--surface-2))';
      el.style.borderColor = 'hsl(var(--destructive) / 0.3)';
    } else {
      el.style.backgroundColor = 'hsl(var(--surface-2))';
      el.style.borderColor = 'hsl(var(--border))';
    }

    let iconHtml = '';
    if (type === 'success') iconHtml = `<i data-lucide="check-circle" class="size-4 text-success shrink-0"></i>`;
    else if (type === 'error') iconHtml = `<i data-lucide="x-circle" class="size-4 text-destructive shrink-0"></i>`;
    else iconHtml = `<i data-lucide="info" class="size-4 text-primary shrink-0"></i>`;

    el.innerHTML = `
      ${iconHtml}
      <span class="flex-1">${message}</span>
      <button class="text-muted-foreground hover:text-foreground">
        <i data-lucide="x" class="size-4"></i>
      </button>
    `;

    // Append and render icons inside toast
    this.container.appendChild(el);
    if (window.lucide) {
      lucide.createIcons({ root: el });
    }

    // Bind close
    const closeBtn = el.querySelector('button');
    closeBtn.addEventListener('click', () => this.dismiss(el));

    // Animate in
    requestAnimationFrame(() => {
      el.classList.remove('translate-y-4', 'opacity-0');
    });

    // Auto dismiss
    setTimeout(() => {
      this.dismiss(el);
    }, 4000);
  },

  dismiss(el) {
    el.classList.add('translate-y-4', 'opacity-0');
    el.addEventListener('transitionend', () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  },

  success(msg) { this.createToast(msg, 'success'); },
  error(msg) { this.createToast(msg, 'error'); },
  info(msg) { this.createToast(msg, 'default'); }
};

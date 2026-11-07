const HOST_ID = 'fuck-age-verification-toast';
let hideTimer: number | undefined;

export function showToast(message: string, duration = 3200): void {
  if (!document.documentElement) return;

  let host = document.getElementById(HOST_ID);
  let root: ShadowRoot;

  if (host?.shadowRoot) {
    root = host.shadowRoot;
  } else {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;pointer-events:none;';
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        .toast {
          max-width: 320px;
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          background: #16161c;
          color: #f4f4f5;
          font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
          animation: in 160ms ease-out;
        }
        @keyframes in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div class="toast" role="status"></div>
    `;
    document.documentElement.appendChild(host);
  }

  const toast = root.querySelector<HTMLElement>('.toast');
  if (!toast) return;

  toast.textContent = message;
  host.style.display = 'block';

  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    host!.style.display = 'none';
  }, duration);
}

import { SETTINGS_KEY, ext, getVersion, storageGet, storageSet } from '../core/browser';
import { matchPattern } from '../core/host';
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from '../core/settings';
import type { ModuleMeta } from '../core/types';
import { catalog } from '../modules/catalog';

const app = document.querySelector<HTMLDivElement>('#app');
const moduleIds = catalog.map((module) => module.id);

let settings: Settings = normalizeSettings(DEFAULT_SETTINGS, moduleIds);
let currentTabId: number | undefined;
let currentModuleId: string | undefined;

if (app) {
  void main();
}

async function main(): Promise<void> {
  const stored = await storageGet<unknown>(SETTINGS_KEY);
  settings = normalizeSettings(stored, moduleIds);

  try {
    const tabs = await ext?.tabs?.query({ active: true, currentWindow: true });
    const tab = tabs?.[0];

    currentTabId = tab?.id;

    if (tab?.url) {
      currentModuleId = catalog.find((module) =>
        module.matches.some((pattern) => matchPattern(pattern, tab.url!)),
      )?.id;
    }
  } catch {
    // activeTab is not available on restricted pages.
  }

  render();

  ext?.storage?.onChanged?.addListener((changes, area) => {
    if (area !== 'local' || !changes[SETTINGS_KEY]) return;

    settings = normalizeSettings(changes[SETTINGS_KEY].newValue, moduleIds);
    render();
  });
}

function render(): void {
  if (!app) return;

  const current = catalog.find((module) => module.id === currentModuleId);
  const version = getVersion();

  app.innerHTML = `
    <header class="hero">
      <div class="brand">
        <div class="mark" aria-hidden="true">18<span>×</span></div>
        <div>
          <h1>Fuck Age Verification</h1>
          <p>Gates client-side, avisos de conteúdo e overlays 18+ fora do caminho.</p>
        </div>
      </div>
      <label class="switch" title="Ligar ou desligar tudo">
        <input id="global" type="checkbox" ${settings.enabled ? 'checked' : ''} />
        <span class="track"><span class="thumb"></span></span>
      </label>
    </header>

    <section class="current ${current ? 'is-active' : ''}">
      <span class="dot" style="--dot:${current?.color ?? '#71717a'}"></span>
      <div>
        <strong>${current ? escapeHtml(current.name) : 'Nenhum site compatível nesta aba'}</strong>
        <small>${current ? 'Módulo ativo nesta aba' : 'Abra um dos sites suportados para usar'}</small>
      </div>
      ${current && currentTabId !== undefined ? '<button id="reload" class="ghost" type="button">Recarregar</button>' : ''}
    </section>

    <main class="modules">
      ${catalog.map(renderModule).join('')}
    </main>

    <footer>
      <label class="toasts" title="Mostrar notificações da extensão">
        <input id="toasts" type="checkbox" ${settings.showToasts ? 'checked' : ''} />
        notificações
      </label>
      <span>v${escapeHtml(version)}</span>
      <a href="https://github.com/pxdritz1/fuck-age-verification" target="_blank" rel="noreferrer">GitHub</a>
    </footer>
  `;

  bind();
}

function renderModule(module: ModuleMeta): string {
  const enabled = settings.enabled && settings.modules[module.id] !== false;
  const isCurrent = currentModuleId === module.id;

  return `
    <label class="module ${enabled ? '' : 'is-off'} ${isCurrent ? 'is-current' : ''}">
      <span class="badge" style="--badge:${module.color ?? '#71717a'}">${escapeHtml(module.name.slice(0, 1))}</span>
      <span class="info">
        <span class="name">
          ${escapeHtml(module.name)}
          ${isCurrent ? '<em>nesta aba</em>' : ''}
        </span>
        <span class="desc">${escapeHtml(module.description)}</span>
      </span>
      <span class="switch small">
        <input
          type="checkbox"
          data-module="${module.id}"
          ${enabled ? 'checked' : ''}
          ${settings.enabled ? '' : 'disabled'}
        />
        <span class="track"><span class="thumb"></span></span>
      </span>
    </label>
  `;
}

function bind(): void {
  if (!app) return;

  app.querySelector<HTMLInputElement>('#global')?.addEventListener('change', (event) => {
    settings.enabled = (event.target as HTMLInputElement).checked;
    void save();
  });

  for (const input of app.querySelectorAll<HTMLInputElement>('input[data-module]')) {
    input.addEventListener('change', () => {
      const id = input.dataset.module;
      if (!id) return;

      settings.modules[id] = input.checked;
      void save();
    });
  }

  app.querySelector<HTMLInputElement>('#toasts')?.addEventListener('change', (event) => {
    settings.showToasts = (event.target as HTMLInputElement).checked;
    void save();
  });

  app.querySelector<HTMLButtonElement>('#reload')?.addEventListener('click', () => {
    if (currentTabId !== undefined) void ext?.tabs?.reload(currentTabId);
  });
}

async function save(): Promise<void> {
  await storageSet(SETTINGS_KEY, settings);
  render();
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]!);
}

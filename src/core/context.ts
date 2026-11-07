import { applyClickRules, injectStyle, removeElements, unlockPageScroll } from './dom';
import { showToast } from './toast';
import type { ContentContext, ModuleMeta, ObserveOptions } from './types';

export function createContext(
  meta: ModuleMeta,
  isEnabled: () => boolean,
  getShowToasts: () => boolean = () => true,
): ContentContext {
  let clicked = new WeakSet<Element>();

  const log = (...args: unknown[]) => {
    console.debug(`[FAV:${meta.id}]`, ...args);
  };

  const observe = (callback: () => void, options: ObserveOptions = {}): (() => void) => {
    const throttleMs = options.throttleMs ?? 250;
    let scheduled = false;
    let observer: MutationObserver | undefined;
    let timer: number | undefined;

    const run = () => {
      if (!isEnabled()) return;
      try {
        callback();
      } catch (error) {
        log('observer callback failed', error);
      }
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      timer = window.setTimeout(() => {
        scheduled = false;
        run();
      }, throttleMs);
    };

    const start = () => {
      if (observer) return;

      observer = new MutationObserver(schedule);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: options.attributes ?? true,
        attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'open'],
      });

      document.addEventListener('DOMContentLoaded', run, { once: true });
      window.addEventListener('load', run, { once: true });
    };

    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });

    return () => {
      observer?.disconnect();
      observer = undefined;
      if (timer) window.clearTimeout(timer);
    };
  };

  const onNavigate = (callback: () => void): (() => void) => {
    let lastUrl = location.href;

    const check = () => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      clicked = new WeakSet<Element>();

      if (!isEnabled()) return;

      try {
        callback();
      } catch (error) {
        log('navigation callback failed', error);
      }
    };

    const interval = window.setInterval(check, 500);
    window.addEventListener('popstate', check);
    window.addEventListener('hashchange', check);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('popstate', check);
      window.removeEventListener('hashchange', check);
    };
  };

  const click = (rules: Parameters<ContentContext['click']>[0]): number => {
    if (!isEnabled()) return 0;

    try {
      return applyClickRules(rules, document, clicked);
    } catch (error) {
      log('click rules failed', error);
      return 0;
    }
  };

  const remove = (selectors: string[]): number => {
    if (!isEnabled()) return 0;
    return removeElements(document, selectors);
  };

  const hide = (selectors: string[]): void => {
    if (selectors.length === 0) return;

    // Scoped to the module flag, so injecting while disabled is harmless.
    const scope = `html[data-fav-${meta.id}="1"]`;
    const css = selectors.map((selector) => `${scope} ${selector}{display:none!important}`).join('\n');
    injectStyle(document, `fav-hide-${meta.id}`, css);
  };

  const unlockScroll = (): void => {
    if (!isEnabled()) return;
    unlockPageScroll(document);
  };

  const toast = (message: string): void => {
    if (!isEnabled() || !getShowToasts()) return;
    showToast(message);
  };

  const ready = (): Promise<void> => {
    if (document.readyState !== 'loading') return Promise.resolve();

    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
  };

  return {
    meta,
    log,
    observe,
    onNavigate,
    click,
    remove,
    hide,
    unlockScroll,
    toast,
    ready,
    isEnabled,
  };
}

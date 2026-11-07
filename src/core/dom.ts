import type { ClickRule } from './types';

const CLICKABLE_SELECTOR = [
  'button',
  'a[href]',
  'input[type="button"]',
  'input[type="submit"]',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])',
  'summary',
].join(',');

export function normalizeText(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function collectText(element: Element): string {
  const parts: string[] = [];
  const text = element.textContent;

  if (text) parts.push(text);

  for (const attribute of ['aria-label', 'title', 'value', 'alt']) {
    const value = element.getAttribute(attribute);
    if (value) parts.push(value);
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.value) parts.push(element.value);
  }

  return parts.join(' ');
}

export function matchesText(element: Element, patterns: Array<string | RegExp>): boolean {
  const text = normalizeText(collectText(element));

  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      const expected = normalizeText(pattern);
      return text === expected || text.includes(expected);
    }

    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

export function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hidden) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;

  const view = element.ownerDocument.defaultView;
  const style = view?.getComputedStyle(element);

  if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) {
    return false;
  }

  return element.getClientRects().length > 0;
}

function isDisabled(element: Element): boolean {
  return element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true';
}

function collectSearchRoots(root: ParentNode): ParentNode[] {
  const roots: ParentNode[] = [root];
  const queue: ParentNode[] = [root];
  const seen = new Set<ParentNode>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);

    for (const element of current.querySelectorAll('*')) {
      const shadow = element.shadowRoot;
      if (!shadow || seen.has(shadow)) continue;

      roots.push(shadow);
      queue.push(shadow);
    }
  }

  return roots;
}

export function querySelectorAllDeep(root: ParentNode, selector: string): Element[] {
  const results: Element[] = [];

  for (const searchRoot of collectSearchRoots(root)) {
    try {
      results.push(...searchRoot.querySelectorAll(selector));
    } catch {
      return [];
    }
  }

  return results;
}

function collectCandidates(root: ParentNode, rule: ClickRule): Element[] {
  const candidates = new Set<Element>();
  const selectors = rule.selectors ?? [CLICKABLE_SELECTOR];

  for (const searchRoot of collectSearchRoots(root)) {
    for (const selector of selectors) {
      let matches: NodeListOf<Element>;

      try {
        matches = searchRoot.querySelectorAll(selector);
      } catch {
        continue;
      }

      for (const element of matches) {
        if (rule.text && !matchesText(element, rule.text)) continue;
        candidates.add(element);
      }
    }
  }

  return [...candidates];
}

export function clickElement(element: Element): void {
  if (element instanceof HTMLElement) {
    element.focus?.();
    element.click();
    return;
  }

  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

export function applyClickRules(
  rules: ClickRule[],
  document: Document,
  clicked: WeakSet<Element> = new WeakSet(),
): number {
  let count = 0;

  for (const rule of rules) {
    const roots: ParentNode[] = rule.scope
      ? querySelectorAllDeep(document, rule.scope)
      : [document];

    if (roots.length === 0) continue;

    const limit = rule.max ?? 3;
    let clickedInRule = 0;

    for (const root of roots) {
      for (const element of collectCandidates(root, rule)) {
        if (clickedInRule >= limit) break;
        if (clicked.has(element) || isDisabled(element)) continue;
        if (!rule.includeHidden && !isVisible(element)) continue;

        clicked.add(element);
        clickElement(element);
        clickedInRule += 1;
        count += 1;
      }

      if (clickedInRule >= limit) break;
    }
  }

  return count;
}

export function removeElements(document: Document, selectors: string[]): number {
  let count = 0;

  for (const selector of selectors) {
    let elements: NodeListOf<Element>;

    try {
      elements = document.querySelectorAll(selector);
    } catch {
      continue;
    }

    for (const element of elements) {
      element.remove();
      count += 1;
    }
  }

  return count;
}

export function injectStyle(document: Document, id: string, css: string): void {
  if (!css) return;

  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  (document.head ?? document.documentElement).appendChild(style);
}

export function unlockPageScroll(document: Document): void {
  for (const element of [document.documentElement, document.body]) {
    if (!element) continue;
    element.style.removeProperty('overflow');
    element.style.removeProperty('position');
    element.classList.remove(
      'modal-open',
      'no-scroll',
      'overflow-hidden',
      'scroll-lock',
      'rpl-scroll-lock',
    );
  }
}

import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

const HIDE_SELECTORS = [
  '#configured-xpromo-blocking_xpromo_nsfw_blocking_desktop',
  'configured-xpromo-blocking_xpromo_nsfw_blocking',
  'desktop-dynamic-upsell-dialog',
  'xpromo-nsfw-blocking-container',
];

export function setup(ctx: ContentContext): void {
  if (ctx.isEnabled()) {
    try {
      document.cookie = 'over18=1; path=/; domain=.reddit.com; secure; SameSite=Lax';
    } catch {
      // The background script also sets this cookie through the cookies API.
    }
  }

  ctx.hide(HIDE_SELECTORS);

  const run = () => {
    if (!ctx.isEnabled()) return;

    removeNsfwPrompt();
    unblurMedia();

    if (location.pathname.startsWith('/over18')) {
      const form = document.querySelector<HTMLFormElement>('form[action*="over18"]');
      if (form) {
        const yes = form.querySelector<HTMLInputElement>('input[name="over18"][value="yes"]');
        if (yes) yes.checked = true;
        form.submit();
        return;
      }
    }

    const clicked = ctx.click([
      {
        selectors: [
          'button[name="over18"]',
          'input[name="over18"][value="yes"]',
          'button[data-testid="age-gate-continue"]',
          'shreddit-age-gate button[type="submit"]',
        ],
      },
      {
        scope: 'shreddit-age-gate, [data-testid="age-gate"], [aria-modal="true"], div[role="dialog"]',
        text: [
          /^yes,? (i'?m )?(over )?18\+?$/i,
          /^i'?m over 18$/i,
          /^yes,? continue$/i,
          /^continue$/i,
          /^view community$/i,
          /^enter$/i,
        ],
      },
    ]);

    if (clicked || document.body?.classList.contains('rpl-scroll-lock')) {
      ctx.unlockScroll();
    }
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

function removeNsfwPrompt(): void {
  const container = document.querySelector('xpromo-nsfw-blocking-container');
  container?.shadowRoot?.querySelector('.prompt')?.remove();
}

function unblurMedia(): void {
  for (const container of document.querySelectorAll('shreddit-blurred-container[blurred]')) {
    container.removeAttribute('blurred');
  }

  for (const post of document.querySelectorAll('pdp-right-rail reddit-pdp-right-rail-post')) {
    const thumbnail = post.querySelector("div[data-testid='post-thumbnail']");
    thumbnail?.querySelector('img')?.removeAttribute('style');
    thumbnail?.querySelector('div')?.remove();
  }
}

export default { meta, setup };

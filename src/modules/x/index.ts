import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

export function setup(ctx: ContentContext): void {
  const run = () => {
    const clicked = ctx.click([
      {
        scope: '[data-testid="sensitiveWarning"], [aria-modal="true"], div[role="dialog"]',
        text: [/^view( profile| post)?$/i, /^show$/i, /^see post$/i, /^continue$/i, /^yes,? view$/i],
      },
      {
        selectors: [
          '[data-testid="sensitiveWarning"] [role="button"]',
          '[data-testid="sensitiveWarning"] button',
        ],
      },
    ]);

    if (clicked) ctx.unlockScroll();
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

export default { meta, setup };

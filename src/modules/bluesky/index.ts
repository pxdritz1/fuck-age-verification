import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

export function setup(ctx: ContentContext): void {
  const run = () => {
    const clicked = ctx.click([
      {
        scope:
          '[role="dialog"], [aria-modal="true"], article, [data-testid*="warning"], [data-testid*="label"]',
        text: [/^show$/i, /^view$/i, /^show post$/i, /^continue$/i, /^i understand$/i],
      },
    ]);

    if (clicked) ctx.unlockScroll();
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

export default { meta, setup };

import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

export function setup(ctx: ContentContext): void {
  const run = () => {
    const clicked = ctx.click([
      {
        scope: 'div[role="dialog"], [aria-modal="true"], [data-testid="age-gate"]',
        text: [
          /^i'?m over 18$/i,
          /^i am over 18$/i,
          /^yes,? i'?m 18/i,
          /^enter$/i,
          /^continue$/i,
          /^see post$/i,
          /^view post$/i,
          /^i understand$/i,
        ],
      },
      {
        selectors: ['[data-testid="age-gate"] button', '[data-testid="age-gate"] [role="button"]'],
      },
    ]);

    if (clicked) ctx.unlockScroll();
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

export default { meta, setup };

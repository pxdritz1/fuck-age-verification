import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

export function setup(ctx: ContentContext): void {
  const run = () => {
    const clicked = ctx.click([
      {
        scope: 'div[role="dialog"], [aria-modal="true"], [data-e2e*="age"], [data-e2e*="warning"]',
        text: [
          /^view$/i,
          /^continue$/i,
          /^watch anyway$/i,
          /^i understand$/i,
          /^show$/i,
          /^see post$/i,
          /^i'?m 18/i,
        ],
      },
      {
        selectors: ['div[role="dialog"] button', '[aria-modal="true"] button'],
        text: [/^view$/i, /^continue$/i],
      },
    ]);

    if (clicked) ctx.unlockScroll();
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

export default { meta, setup };

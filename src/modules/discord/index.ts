import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

export function setup(ctx: ContentContext): void {
  const run = () => {
    const clicked = ctx.click([
      {
        scope: '[role="dialog"], [aria-modal="true"], [class*="ageRestricted"], [class*="ageGate"]',
        text: [
          /^i understand$/i,
          /^continue$/i,
          /^view channel$/i,
          /^yes,? i'?m 18/i,
          /^enter channel$/i,
        ],
      },
      {
        selectors: ['[class*="ageRestricted"] button', '[class*="ageGate"] button'],
        text: [/^i understand$/i, /^continue$/i, /^view channel$/i],
      },
    ]);

    if (clicked) ctx.unlockScroll();
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

export default { meta, setup };

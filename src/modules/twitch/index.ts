import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

export function setup(ctx: ContentContext): void {
  const run = () => {
    const clicked = ctx.click([
      {
        selectors: [
          '[data-a-target="player-overlay-mature-accept"]',
          'button[data-a-target="player-overlay-mature-accept"]',
        ],
      },
      {
        scope: '[role="dialog"], [aria-modal="true"]',
        text: [/^start watching$/i, /^continue$/i, /^i understand$/i, /^yes,? i'?m 18/i],
      },
    ]);

    if (clicked) ctx.unlockScroll();
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

export default { meta, setup };

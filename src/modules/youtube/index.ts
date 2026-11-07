import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

export function setup(ctx: ContentContext): void {
  let notified = false;

  const run = () => {
    ctx.click([
      {
        scope: 'ytd-player, tp-yt-paper-dialog, [role="dialog"]',
        text: [/^i understand$/i, /^continue$/i, /^watch anyway$/i],
      },
    ]);

    if (notified) return;

    const player = document.querySelector('ytd-player');
    const text = player?.textContent ?? '';

    if (/sign in to confirm your age|age-restricted/i.test(text)) {
      notified = true;
      ctx.toast('Tentando liberar este vídeo com restrição de idade…');
    }
  };

  ctx.onNavigate(run);
  ctx.observe(run, { throttleMs: 400 });
  void ctx.ready().then(run);
}

export default { meta, setup };

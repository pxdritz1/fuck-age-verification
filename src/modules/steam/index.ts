import type { ContentContext, ModuleMeta } from '../../core/types';
import metaJson from './module.json';

const meta = metaJson as ModuleMeta;

const COOKIES: Array<[string, string]> = [
  ['wants_mature_content', '1'],
  ['lastagecheckage', '1-January-1995'],
  ['birthtime', '788914801'],
];

export function setup(ctx: ContentContext): void {
  if (ctx.isEnabled()) writeCookies();

  const run = () => {
    if (!ctx.isEnabled()) return;

    writeCookies();

    const day = document.querySelector<HTMLSelectElement>(
      '#ageDay, select[name="ageDay"], select[name="age_day"]',
    );
    const month = document.querySelector<HTMLSelectElement>(
      '#ageMonth, select[name="ageMonth"], select[name="age_month"]',
    );
    const year = document.querySelector<HTMLSelectElement>(
      '#ageYear, select[name="ageYear"], select[name="age_year"]',
    );

    if (day && month && year) {
      setSelect(day, ['1']);
      setSelect(month, ['1', 'January', 'january']);
      setSelect(year, ['1995']);

      const submit = document.querySelector<HTMLElement>(
        '#age_gate_btn, #age_gate_form button[type="submit"], #age_gate_form input[type="submit"], button[type="submit"], input[type="submit"]',
      );

      if (submit) {
        submit.click();
      } else {
        day.closest('form')?.submit();
      }

      return;
    }

    const clicked = ctx.click([
      { selectors: ['#age_gate_btn', 'a[href*="agecheck"]', 'button[data-age-gate]'] },
      {
        scope: '#app_agegate, [id*="agegate"], [class*="agegate"], [role="dialog"], [aria-modal="true"]',
        text: [
          /^view page$/i,
          /^continue$/i,
          /^i'?m 18 or older$/i,
          /^enter$/i,
          /^yes,? i'?m 18/i,
        ],
      },
    ]);

    if (clicked) ctx.unlockScroll();
  };

  ctx.onNavigate(run);
  ctx.observe(run);
  void ctx.ready().then(run);
}

function writeCookies(): void {
  for (const domain of ['.steampowered.com', '.steamcommunity.com']) {
    for (const [name, value] of COOKIES) {
      try {
        document.cookie = `${name}=${value}; path=/; domain=${domain}; secure; SameSite=Lax`;
      } catch {
        // The background script also sets these through the cookies API.
      }
    }
  }
}

function setSelect(select: HTMLSelectElement, candidates: string[]): boolean {
  for (const candidate of candidates) {
    const exists = [...select.options].some((option) => option.value === candidate);

    if (!exists) continue;

    select.value = candidate;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  return false;
}

export default { meta, setup };

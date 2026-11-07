import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyClickRules,
  isVisible,
  matchesText,
  normalizeText,
  unlockPageScroll,
} from '../src/core/dom';

describe('normalizeText', () => {
  it('collapses whitespace, strips zero-width characters and lowercases', () => {
    expect(normalizeText('  Yes,\u200B   CONTINUE \n')).toBe('yes, continue');
  });
});

describe('matchesText', () => {
  it('matches strings and regular expressions against element text', () => {
    const button = document.createElement('button');
    button.textContent = 'Yes, continue';

    expect(matchesText(button, ['continue'])).toBe(true);
    expect(matchesText(button, [/^yes,? continue$/i])).toBe(true);
    expect(matchesText(button, ['nope'])).toBe(false);
  });

  it('includes aria labels and input values', () => {
    const input = document.createElement('input');
    input.value = 'View post';
    input.setAttribute('aria-label', 'View sensitive post');

    expect(matchesText(input, [/view sensitive post/i])).toBe(true);
    expect(matchesText(input, [/view post/i])).toBe(true);
  });
});

describe('isVisible', () => {
  it('rejects hidden elements', () => {
    const hidden = document.createElement('button');
    hidden.hidden = true;

    expect(isVisible(hidden)).toBe(false);
  });
});

describe('applyClickRules', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('clicks a button scoped by a dialog and text pattern', () => {
    document.body.innerHTML = `
      <div role="dialog">
        <button id="yes">Yes, continue</button>
        <button id="no">No, take me back</button>
      </div>
    `;

    let clicked = '';
    document.querySelector('#yes')!.addEventListener('click', () => {
      clicked = 'yes';
    });
    document.querySelector('#no')!.addEventListener('click', () => {
      clicked = 'no';
    });

    const count = applyClickRules(
      [
        {
          scope: 'div[role="dialog"]',
          text: [/^yes,? continue$/i],
          includeHidden: true,
        },
      ],
      document,
    );

    expect(count).toBe(1);
    expect(clicked).toBe('yes');
  });

  it('does not click the same element twice', () => {
    document.body.innerHTML = '<button id="one">Continue</button>';

    let clicks = 0;
    document.querySelector('#one')!.addEventListener('click', () => {
      clicks += 1;
    });

    const clicked = new WeakSet<Element>();
    const rule = { selectors: ['#one'], includeHidden: true };

    expect(applyClickRules([rule], document, clicked)).toBe(1);
    expect(applyClickRules([rule], document, clicked)).toBe(0);
    expect(clicks).toBe(1);
  });

  it('honours max and skips disabled buttons', () => {
    document.body.innerHTML = `
      <button class="action">Continue</button>
      <button class="action" disabled>Continue</button>
      <button class="action">Continue</button>
    `;

    const count = applyClickRules(
      [{ selectors: ['.action'], includeHidden: true, max: 1 }],
      document,
    );

    expect(count).toBe(1);
  });

  it('clicks buttons inside open shadow roots', () => {
    document.body.innerHTML = '<div id="host"></div>';

    const host = document.querySelector('#host')!;
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div role="dialog"><button id="inside">Continue</button></div>';

    let clicked = false;
    shadow.querySelector('#inside')!.addEventListener('click', () => {
      clicked = true;
    });

    const count = applyClickRules(
      [{ scope: 'div[role="dialog"]', text: [/^continue$/i], includeHidden: true }],
      document,
    );

    expect(count).toBe(1);
    expect(clicked).toBe(true);
  });
});

describe('unlockPageScroll', () => {
  beforeEach(() => {
    document.body.className = '';
    document.documentElement.removeAttribute('style');
  });

  it('removes reddit scroll lock classes and inline overflow', () => {
    document.body.className = 'rpl-scroll-lock';
    document.documentElement.style.overflow = 'hidden';

    unlockPageScroll(document);

    expect(document.body.classList.contains('rpl-scroll-lock')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });
});

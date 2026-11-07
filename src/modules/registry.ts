import type { ContentContext, ModuleDefinition } from '../core/types';
import { catalog } from './catalog';
import { setup as bluesky } from './bluesky';
import { setup as discord } from './discord';
import { setup as facebook } from './facebook';
import { setup as instagram } from './instagram';
import { setup as reddit } from './reddit';
import { setup as steam } from './steam';
import { setup as threads } from './threads';
import { setup as tiktok } from './tiktok';
import { setup as twitch } from './twitch';
import { setup as x } from './x';
import { setup as youtube } from './youtube';

type Setup = (ctx: ContentContext) => void | Promise<void>;

const setups: Record<string, Setup> = {
  reddit,
  x,
  youtube,
  instagram,
  facebook,
  threads,
  bluesky,
  tiktok,
  twitch,
  discord,
  steam,
};

export const modules: ModuleDefinition[] = catalog.map((meta) => {
  const setup = setups[meta.id];

  if (!setup) throw new Error(`Missing setup for module "${meta.id}"`);

  return { meta, setup };
});

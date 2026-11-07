import type { ModuleMeta } from '../core/types';
import bluesky from './bluesky/module.json';
import discord from './discord/module.json';
import facebook from './facebook/module.json';
import instagram from './instagram/module.json';
import reddit from './reddit/module.json';
import steam from './steam/module.json';
import threads from './threads/module.json';
import tiktok from './tiktok/module.json';
import twitch from './twitch/module.json';
import x from './x/module.json';
import youtube from './youtube/module.json';

export const catalog = (
  [reddit, x, youtube, instagram, facebook, threads, bluesky, tiktok, twitch, discord, steam] as ModuleMeta[]
).sort((left, right) => (left.order ?? 100) - (right.order ?? 100));

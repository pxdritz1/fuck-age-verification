import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalog } from '../src/modules/catalog';

const modulesDir = path.resolve('src/modules');
const directories = readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe('module catalog', () => {
  it('loads every module.json from disk', () => {
    const fromDisk = directories
      .filter((directory) => existsSync(path.join(modulesDir, directory, 'module.json')))
      .sort();
    const fromCatalog = catalog.map((module) => module.id).sort();

    expect(fromCatalog).toEqual(fromDisk);
  });

  it('has unique ids and valid metadata', () => {
    const ids = new Set<string>();

    for (const module of catalog) {
      expect(module.id).toMatch(/^[a-z0-9-]+$/);
      expect(module.name.length).toBeGreaterThan(0);
      expect(module.description.length).toBeGreaterThan(0);
      expect(module.matches.length).toBeGreaterThan(0);
      expect(ids.has(module.id)).toBe(false);

      ids.add(module.id);

      for (const match of module.matches) {
        expect(match).toMatch(/^(\*|https?):\/\/[^/]+\/.*/);
      }
    }
  });

  it('keeps cookies complete and ordered by module order', () => {
    for (const module of catalog) {
      for (const cookie of module.cookies ?? []) {
        expect(cookie.name.length).toBeGreaterThan(0);
        expect(cookie.value.length).toBeGreaterThan(0);
        expect(cookie.domain.startsWith('.')).toBe(true);
      }
    }

    const orders = catalog.map((module) => module.order ?? 100);
    expect(orders).toEqual([...orders].sort((left, right) => left - right));
  });

  it('points page scripts at real files', () => {
    for (const module of catalog) {
      if (!module.pageScript) continue;

      const file = path.join(modulesDir, module.id, module.pageScript);
      expect(existsSync(file)).toBe(true);

      const contents = readFileSync(file, 'utf8');
      expect(contents.length).toBeGreaterThan(0);
    }
  });
});

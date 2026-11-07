import { createWriteStream } from 'node:fs';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const args = process.argv.slice(2);
const browsers = parseBrowsers(args);
const shouldZip = args.includes('--zip');
const version = pkg.version;

const catalog = await loadCatalog();
validateUniqueIds(catalog);

for (const browser of browsers) {
  if (browser !== 'chrome' && browser !== 'firefox') {
    throw new Error(`Unknown browser "${browser}". Use chrome or firefox.`);
  }

  const outDir = await buildBrowser(browser, catalog);
  console.log(`built ${browser}: ${path.relative(root, outDir)}`);

  if (shouldZip) {
    const zipPath = await zipBrowser(browser, outDir);
    console.log(`zipped ${browser}: ${path.relative(root, zipPath)}`);
  }
}

function parseBrowsers(values) {
  const requested = values
    .filter((value) => value.startsWith('--browser='))
    .flatMap((value) => value.slice('--browser='.length).split(','))
    .filter(Boolean);

  return requested.length > 0 ? [...new Set(requested)] : ['chrome', 'firefox'];
}

async function loadCatalog() {
  const modulesDir = path.join(root, 'src', 'modules');
  const entries = await readdir(modulesDir, { withFileTypes: true });
  const modules = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const file = path.join(modulesDir, entry.name, 'module.json');
    if (!existsSync(file)) continue;

    const meta = JSON.parse(await readFile(file, 'utf8'));
    validateMeta(meta, file);
    modules.push(meta);
  }

  if (modules.length === 0) throw new Error('No modules found in src/modules');

  return modules.sort(
    (left, right) => (left.order ?? 100) - (right.order ?? 100) || left.name.localeCompare(right.name),
  );
}

function validateMeta(meta, file) {
  const relative = path.relative(root, file);
  const fail = (message) => {
    throw new Error(`${relative}: ${message}`);
  };

  if (!meta || typeof meta !== 'object') fail('invalid JSON object');
  if (!/^[a-z0-9-]+$/.test(meta.id ?? '')) fail('invalid id');
  if (typeof meta.name !== 'string' || meta.name.length === 0) fail('missing name');
  if (typeof meta.description !== 'string' || meta.description.length === 0) fail('missing description');

  if (!Array.isArray(meta.matches) || meta.matches.length === 0) fail('missing matches');

  for (const match of meta.matches) {
    if (typeof match !== 'string' || !/^(\*|https?):\/\/[^/]+\/.*/.test(match)) {
      fail(`invalid match pattern "${match}"`);
    }
  }

  if (meta.cookies !== undefined && !Array.isArray(meta.cookies)) fail('cookies must be an array');

  for (const cookie of meta.cookies ?? []) {
    if (!cookie.name || !cookie.value || !cookie.domain) fail('invalid cookie rule');
  }

  if (meta.pageScript && !existsSync(path.join(path.dirname(file), meta.pageScript))) {
    fail(`missing pageScript "${meta.pageScript}"`);
  }
}

function validateUniqueIds(modules) {
  const seen = new Set();

  for (const module of modules) {
    if (seen.has(module.id)) throw new Error(`Duplicate module id "${module.id}"`);
    seen.add(module.id);
  }
}

async function buildBrowser(browser, modules) {
  const outDir = path.join(root, 'dist', browser);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const pageEntries = modules
    .filter((module) => module.pageScript)
    .map((module) => ({
      in: path.join(root, 'src', 'modules', module.id, module.pageScript),
      out: `page/${module.id}`,
    }));

  await build({
    entryPoints: [
      { in: path.join(root, 'src', 'background', 'index.ts'), out: 'background' },
      { in: path.join(root, 'src', 'content', 'index.ts'), out: 'content' },
      { in: path.join(root, 'src', 'popup', 'index.ts'), out: 'popup' },
      ...pageEntries,
    ],
    bundle: true,
    outdir: outDir,
    format: 'iife',
    platform: 'browser',
    target: browser === 'firefox' ? ['firefox128'] : ['chrome111'],
    sourcemap: false,
    minify: false,
    legalComments: 'none',
    logLevel: 'info',
    loader: { '.json': 'json' },
    tsconfig: path.join(root, 'tsconfig.json'),
  });

  await cp(path.join(root, 'src', 'popup', 'index.html'), path.join(outDir, 'popup.html'));
  await cp(path.join(root, 'src', 'popup', 'style.css'), path.join(outDir, 'popup.css'));
  await cp(path.join(root, 'assets', 'icons'), path.join(outDir, 'icons'), { recursive: true });

  const manifest = createManifest(browser, modules);
  await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  return outDir;
}

function createManifest(browser, modules) {
  const matches = [...new Set(modules.flatMap((module) => module.matches))];
  const contentScripts = [
    {
      matches,
      js: ['content.js'],
      run_at: 'document_start',
    },
    ...modules
      .filter((module) => module.pageScript)
      .map((module) => ({
        matches: module.pageMatches ?? module.matches,
        js: [`page/${module.id}.js`],
        run_at: module.pageRunAt ?? 'document_start',
        world: 'MAIN',
        ...(module.pageAllFrames ? { all_frames: true } : {}),
      })),
  ];

  const icons = {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  };

  const base = {
    manifest_version: 3,
    name: 'Fuck Age Verification',
    short_name: 'Fuck Age Verification',
    version,
    description: 'Remove verificações de idade client-side, avisos de conteúdo e overlays 18+.',
    homepage_url: 'https://github.com/pxdritz1/fuck-age-verification',
    icons,
    action: {
      default_title: 'Fuck Age Verification',
      default_popup: 'popup.html',
      default_icon: icons,
    },
    permissions: ['storage', 'cookies', 'activeTab'],
    host_permissions: matches,
    content_scripts: contentScripts,
  };

  if (browser === 'chrome') {
    return {
      ...base,
      minimum_chrome_version: '111',
      background: { service_worker: 'background.js' },
    };
  }

  return {
    ...base,
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: {
        id: 'fuck-age-verification@pxdritz1.github.io',
        strict_min_version: '128.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
  };
}

async function zipBrowser(browser, outDir) {
  const artifactsDir = path.join(root, 'artifacts');
  await mkdir(artifactsDir, { recursive: true });

  const zipPath = path.join(
    artifactsDir,
    `fuck-age-verification-${browser}-v${version}.zip`,
  );

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(outDir, false);
    void archive.finalize();
  });

  return zipPath;
}

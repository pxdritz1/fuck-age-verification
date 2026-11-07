# Fuck Age Verification

**English** | [Português](README.pt-BR.md) | [中文](README.zh-CN.md)

[![CI](https://github.com/pxdritz1/fuck-age-verification/actions/workflows/ci.yml/badge.svg)](https://github.com/pxdritz1/fuck-age-verification/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/pxdritz1/fuck-age-verification)](https://github.com/pxdritz1/fuck-age-verification/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A browser extension that removes client-side age gates, sensitive-content warnings, and 18+ overlays on popular websites.

> **Important:** the extension only changes what the website does inside your browser. Age verification performed on the server — ID upload, credit card, selfie, or account verification — cannot be bypassed by a browser extension. See [Limitations](#limitations).

## Table of contents

- [What it does](#what-it-does)
- [Reddit and X in detail](#reddit-and-x-in-detail)
- [Supported sites](#supported-sites)
- [Installation](#installation)
- [Development](#development)
- [How it works](#how-it-works)
- [Privacy](#privacy)
- [Limitations](#limitations)
- [Legal notice](#legal-notice)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## What it does

- Skips age gates and 18+ overlays implemented in the browser.
- Keeps age-confirmation cookies on sites that use that mechanism (Reddit and Steam).
- Removes sensitive-content warnings by automatically clicking buttons such as "View post", "Continue", and "I'm over 18".
- Unlocks age-restricted videos on YouTube.
- Disables X's client-side age-verification flow in the page state.
- Relaxes Bluesky sensitive-content labels and disables its client-side age-assurance config.
- Lets you turn the whole extension, or each site individually, on or off from the popup.
- Works on Chromium browsers (Chrome, Edge, Brave, Opera, Vivaldi) and Firefox.

The extension does not contact any server owned by this project, does not collect telemetry, and does not send browsing data to third parties. See [Privacy](#privacy).

## Reddit and X in detail

These are the two cases you are most likely to notice in daily use.

### Reddit: the 18+ interstitial

When you open an NSFW subreddit, Reddit may show an `/over18` page or an "over 18" modal before showing the community. The Reddit module:

1. writes the `over18=1` cookie for `.reddit.com` (through the background script and as a `document.cookie` fallback);
2. on `/over18`, checks the "yes" option and submits the form automatically;
3. otherwise clicks the age-gate button or text such as "Yes, I'm over 18", "Continue", "View community", or "Enter";
4. hides Reddit's NSFW promo/upsell containers, removes the shadow-DOM prompt, unlocks the page scroll, and removes the blur from sensitive media containers.

This removes the client-side interstitial. It does **not** bypass a Reddit login requirement, an account-level mature-content setting, or any decision made by Reddit's servers.

### X: sensitive media warnings

When a post contains sensitive media, X blurs it and shows a warning such as "This media may contain sensitive content" with a **View** button. The X module:

1. patches X's client-side feature flags in `__INITIAL_STATE__`, `JSON.parse`, `Response.prototype.json`, and `Object.assign` — including `sensitive_tweet_warnings_enabled` and `rweb_mvr_blurred_media_interstitial_enabled` — so the warning is less likely to be rendered at all;
2. if the warning still appears, automatically clicks **View**, **Show**, **See post**, or **Continue** inside the warning or dialog;
3. also disables the client-side age-assurance flags (`rweb_age_assurance_flow_enabled` and `age_verification_gate_enabled`);
4. normalizes `TweetWithVisibilityResults` wrappers, clears `possibly_sensitive` and profile interstitials, and handles quoted tweets, so the API data itself no longer hides the media.

This handles the "click to reveal sensitive image" flow. It does **not** bypass server-side age verification, identity checks, or account restrictions. X changes its internal state frequently, so this module is the most likely to need updates.

## Supported sites

| Site | What is handled | Strategy |
| --- | --- | --- |
| Reddit | 18+ interstitial and `/over18` page | `over18` cookie, form submission, and age-gate clicks |
| X (Twitter) | Sensitive media warnings and client-side age-assurance flow | Feature-flag patching in the MAIN world and auto-clicks |
| YouTube | Age-restricted videos and content warnings | InnerTube unlocker, request rewriting, and clicks |
| Instagram | Sensitive-content warnings | Auto-clicks on "View post", "Continue", etc. |
| Facebook | Age gates and sensitive-content warnings | Auto-clicks |
| Threads | Sensitive-content warnings | Auto-clicks |
| Bluesky | Sensitive-content labels and age-assurance config | In-memory rewrite of Bluesky API responses and auto-clicks |
| TikTok | Sensitive-content and age warnings | Auto-clicks |
| Twitch | Mature-content warning | Auto-clicks |
| Discord | Age-restricted channels on Discord Web | Auto-clicks |
| Steam | Store and community age gates | Cookies, form filling, and clicks |

Selectors and flows for each site are isolated in `src/modules/<site>/`. When a site changes its HTML, usually only the corresponding module needs an update.

## Installation

### Releases

Download the latest package from the [releases page](https://github.com/pxdritz1/fuck-age-verification/releases):

- `fuck-age-verification-chrome-vX.Y.Z.zip`
- `fuck-age-verification-firefox-vX.Y.Z.zip`

**Chrome, Edge, Brave, Opera, and Vivaldi**

1. Extract the Chrome zip.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.
5. Pin the extension to the toolbar if you want.

**Firefox**

1. Extract the Firefox zip.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select the `manifest.json` file from the extracted folder.

Firefox removes temporary add-ons when the browser closes. For a permanent install, the package must be signed by Mozilla (AMO); this project does not publish a signed build.

### Build from source

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run build
```

The builds are written to `dist/chrome` and `dist/firefox`. To generate the zip packages:

```bash
npm run zip
```

The files are created in `artifacts/`.

## Development

```bash
npm ci
npm run typecheck   # validate TypeScript
npm test            # run the Vitest suite
npm run build       # build Chrome and Firefox
npm run zip         # build and create both zips
npm run check       # typecheck + tests + build
npm run clean       # remove dist/ and artifacts/
```

Build a single browser:

```bash
npm run build:chrome
npm run build:firefox
```

The tests cover URL matching, settings normalization, DOM helpers, the module catalog, the X state patch, and the YouTube unlocker.

### CI and releases

- `.github/workflows/ci.yml` runs typecheck, tests, build, and zip generation on pushes to `main`, pull requests, and manual runs. The zips are available as a workflow artifact for 14 days.
- `.github/workflows/release.yml` runs when a `v*` tag is pushed. It checks that the tag matches the `package.json` version, validates the project, generates the zips, and publishes a GitHub Release with both packages.

To publish a release:

```bash
npm version patch   # or minor / major
git push
git push --tags
```

The tag created by `npm version` (for example `v1.0.1`) triggers the release workflow. The tag version must match the `package.json` version.

## How it works

```text
src/
  core/              types, settings, browser API, URL matching, DOM, toast
  modules/
    catalog.ts       catalog used by the popup and background
    registry.ts      setup registry for each module
    <site>/
      module.json    metadata, matches, cookies, and page-script options
      index.ts       module setup (content script)
      page.ts        optional: script running in the MAIN world
  content/index.ts   content-script entry point
  background/index.ts cookie application
  popup/             settings UI
scripts/build.mjs    build, manifest generation, and zip packaging
tests/               unit tests
```

1. The build reads every `src/modules/*/module.json`, validates the metadata, and generates the Chrome and Firefox manifests.
2. The content script identifies the module for the current URL and runs only that module's `setup`.
3. Modules with `pageScript` get an extra script in the MAIN world. This is required to intercept objects owned by the page itself (X and YouTube).
4. The background applies cookies through `chrome.cookies` on install, startup, navigation, and settings changes.
5. The popup stores preferences in `chrome.storage.local`; content scripts and the background react to changes in real time.
6. A `data-fav-<id>` attribute on `<html>` tells MAIN-world scripts whether the module is active, since they cannot access the extension storage directly.
7. The X and Bluesky page scripts normalize API data in memory before the app renders it. This is the cross-browser alternative to Firefox-only `webRequest` response filtering.

### Adding a site

1. Create `src/modules/<id>/module.json` with `id`, `name`, `description`, and `matches`.
2. Create `src/modules/<id>/index.ts` exporting `setup(ctx: ContentContext)`.
3. Register the module in `src/modules/catalog.ts` and `src/modules/registry.ts`.
4. If the site requires MAIN-world interception, add `pageScript`, `pageMatches`, `pageRunAt`, and, if needed, `pageAllFrames` to `module.json`.
5. Add tests for any pure logic and run `npm run check`.

Accepted `module.json` fields:

| Field | Description |
| --- | --- |
| `id` | Unique identifier using lowercase letters, numbers, and hyphens |
| `name`, `description` | Text shown in the popup |
| `matches` | Content-script URL patterns and host permissions |
| `order`, `color`, `category` | Popup ordering and appearance |
| `cookies` | Cookie rules applied by the background |
| `pageScript` | MAIN-world script path, relative to the module |
| `pageMatches` | MAIN-world URL patterns (default: `matches`) |
| `pageRunAt` | `document_start`, `document_end`, or `document_idle` |
| `pageAllFrames` | Run the MAIN-world script in iframes |

### Compatibility

- Chrome and derivatives: Manifest V3, `minimum_chrome_version` 111.
- Firefox: Manifest V3, `strict_min_version` 128, required for content scripts with `world: "MAIN"`.
- The manifests are generated by the build; do not edit files inside `dist/`.

## Privacy

- Settings are stored only in `chrome.storage.local` in your browser.
- The extension has no analytics, telemetry, ads, or project-owned server.
- Cookies are written only to the domains declared by the modules (Reddit and Steam).
- The X and Bluesky scripts only modify API data in memory; they do not send data anywhere.
- The YouTube script calls YouTube's own `/youtubei/v1/player` endpoint, using the API key and session already present on the page, to obtain an unrestricted player response. No data leaves YouTube because of the extension.
- Requested permissions: `storage`, `cookies`, and `activeTab`, plus host permissions for the supported sites.

## Limitations

- **Server-side verification cannot be removed.** If a site requires a document, credit card, selfie, verified account, or an API-side confirmation, the extension cannot bypass it.
- **Sites change frequently.** Selectors, flag names, and endpoints can break without notice. The affected module must be updated.
- **X, Bluesky, and YouTube are the most fragile modules.** They depend on internal page, API, and player details that can change at any time.
- **Region, account, and login restrictions still apply.** The extension does not create accounts, bypass geoblocks, or remove login requirements.
- **Firefox:** installation is temporary without Mozilla signing; the minimum version is 128.
- **Chromium:** the minimum version is 111 because of Manifest V3 and `world: "MAIN"`.
- **No store publication.** Packages are generated by CI and distributed as unsigned releases.
- **No DRM bypass.** The extension does not download, decrypt, or redistribute content.
- **You remain responsible for the content you access.**

## Legal notice

This extension is provided for personal and educational use only, in your own browser, on sites you are allowed to access. It may violate the Terms of Service of some sites, and you use it at your own risk. The authors are not responsible for misuse, account suspensions, or legal consequences. Do not use the extension to access illegal content or to bypass age verification required by law.

## Contributing

Contributions are welcome, especially new modules and selector fixes.

- Use [Conventional Commits](https://www.conventionalcommits.org/) in English, for example `feat: add example module` or `fix: update reddit age gate selector`.
- Keep each change isolated to the relevant module when possible.
- Run `npm run check` before opening a pull request.
- For bugs, include the browser, extension version, exact URL, and reproduction steps.

## Credits

The per-site approach was informed by [helloyanis/age-verification-bypass](https://github.com/helloyanis/age-verification-bypass), especially its Reddit shadow-DOM handling, X tweet-result normalization, and Bluesky label rewriting. This project does not copy that code; it implements the ideas with a cross-browser Manifest V3 architecture (content scripts plus MAIN-world patching) instead of Firefox-only `webRequest` blocking.

## License

[MIT](LICENSE)

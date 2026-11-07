# Fuck Age Verification

[English](README.md) | [Português](README.pt-BR.md) | **中文**

[![CI](https://github.com/pxdritz1/fuck-age-verification/actions/workflows/ci.yml/badge.svg)](https://github.com/pxdritz1/fuck-age-verification/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/pxdritz1/fuck-age-verification)](https://github.com/pxdritz1/fuck-age-verification/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个浏览器扩展，用于移除热门网站上的客户端年龄验证、敏感内容警告和 18+ 遮罩。

> **重要提示：** 该扩展只修改网站在浏览器内执行的行为。服务器端进行的年龄验证——例如上传证件、信用卡、自拍或账户验证——无法通过浏览器扩展绕过。请参阅[限制](#限制)。

## 目录

- [功能](#功能)
- [Reddit 和 X 详解](#reddit-和-x-详解)
- [支持的网站](#支持的网站)
- [安装](#安装)
- [开发](#开发)
- [工作原理](#工作原理)
- [隐私](#隐私)
- [限制](#限制)
- [法律声明](#法律声明)
- [贡献](#贡献)
- [致谢](#致谢)
- [许可证](#许可证)

## 功能

- 跳过浏览器内实现的年龄验证和 18+ 遮罩。
- 在依赖 Cookie 的网站上保留年龄确认 Cookie（Reddit 和 Steam）。
- 自动点击“查看帖子”“继续”“我已满 18 岁”等按钮，移除敏感内容警告。
- 解锁 YouTube 上受年龄限制的视频。
- 在页面状态中禁用 X 的客户端年龄验证流程。
- 放宽 Bluesky 的敏感内容标签，并禁用其客户端年龄保证配置。
- 可通过弹窗全局开关扩展，或单独开关每个网站。
- 支持 Chromium 浏览器（Chrome、Edge、Brave、Opera、Vivaldi）和 Firefox。

该扩展不会联系本项目自有的服务器，不收集遥测数据，也不会将浏览数据发送给第三方。请参阅[隐私](#隐私)。

## Reddit 和 X 详解

这是日常使用中最容易注意到的两种情况。

### Reddit：18+ 中间页

打开 NSFW 子版块时，Reddit 可能会在显示社区前展示 `/over18` 页面或“是否已满 18 岁”的弹窗。Reddit 模块会：

1. 为 `.reddit.com` 写入 `over18=1` Cookie（通过后台脚本，并以 `document.cookie` 作为后备）；
2. 在 `/over18` 页面上勾选“是”并自动提交表单；
3. 否则点击年龄验证按钮或文本，例如“Yes, I'm over 18”“Continue”“View community”或“Enter”；
4. 隐藏 Reddit 的 NSFW 推广/升级容器，移除 shadow DOM 中的提示，解除页面滚动锁定，并去除敏感媒体容器的模糊效果。

这会移除客户端中间页。它**不会**绕过 Reddit 的登录要求、账户级成人内容设置，或 Reddit 服务器做出的任何判断。

### X：敏感媒体警告

当帖子包含敏感媒体时，X 会模糊图片并显示类似“This media may contain sensitive content”的警告，以及一个 **View** 按钮。X 模块会：

1. 修改 X 在 `__INITIAL_STATE__`、`JSON.parse`、`Response.prototype.json` 和 `Object.assign` 中的客户端功能开关——包括 `sensitive_tweet_warnings_enabled` 和 `rweb_mvr_blurred_media_interstitial_enabled`——从而降低警告被渲染的概率；
2. 如果警告仍然出现，自动点击警告或对话框中的 **View**、**Show**、**See post** 或 **Continue**；
3. 同时禁用客户端年龄保证流程的开关（`rweb_age_assurance_flow_enabled` 和 `age_verification_gate_enabled`）；
4. 规范化 `TweetWithVisibilityResults` 包装、清除 `possibly_sensitive` 和资料页中间页，并处理引用推文，使 API 数据本身不再隐藏媒体。

这会处理“点击查看敏感图片”的流程。它**不会**绕过服务器端年龄验证、身份检查或账户限制。X 会频繁更改内部状态，因此该模块最需要持续更新。

## 支持的网站

| 网站 | 处理内容 | 策略 |
| --- | --- | --- |
| Reddit | 18+ 中间页和 `/over18` 页面 | `over18` Cookie、提交表单和点击年龄验证 |
| X (Twitter) | 敏感媒体警告和客户端年龄保证流程 | 在 MAIN world 修改功能开关并自动点击 |
| YouTube | 年龄限制视频和内容警告 | InnerTube 解锁器、请求改写和点击 |
| Instagram | 敏感内容警告 | 自动点击“View post”“Continue”等 |
| Facebook | 年龄验证和敏感内容警告 | 自动点击 |
| Threads | 敏感内容警告 | 自动点击 |
| Bluesky | 敏感内容标签和年龄保证配置 | 在内存中改写 Bluesky API 响应并自动点击 |
| TikTok | 敏感内容和年龄警告 | 自动点击 |
| Twitch | 成人内容警告 | 自动点击 |
| Discord | Discord Web 中受年龄限制的频道 | 自动点击 |
| Steam | 商店和社区年龄验证 | Cookie、填写表单和点击 |

每个网站的选择器和流程都隔离在 `src/modules/<site>/` 中。网站更改 HTML 时，通常只需要更新对应模块。

## 安装

### 发布版本

从 [releases 页面](https://github.com/pxdritz1/fuck-age-verification/releases)下载最新包：

- `fuck-age-verification-chrome-vX.Y.Z.zip`
- `fuck-age-verification-firefox-vX.Y.Z.zip`

**Chrome、Edge、Brave、Opera 和 Vivaldi**

1. 解压 Chrome 压缩包。
2. 打开 `chrome://extensions`（或 `edge://extensions`）。
3. 启用**开发者模式**。
4. 点击**加载已解压的扩展程序**，选择解压后的文件夹。
5. 如需固定到工具栏，可点击扩展图标进行固定。

**Firefox**

1. 解压 Firefox 压缩包。
2. 打开 `about:debugging#/runtime/this-firefox`。
3. 点击**临时载入附加组件**。
4. 选择解压文件夹中的 `manifest.json` 文件。

Firefox 关闭浏览器后会移除临时附加组件。若要永久安装，安装包必须由 Mozilla（AMO）签名；本项目不发布已签名版本。

### 从源码构建

要求：Node.js 20 或更高版本，以及 npm。

```bash
npm ci
npm run build
```

构建结果位于 `dist/chrome` 和 `dist/firefox`。生成压缩包：

```bash
npm run zip
```

文件会创建在 `artifacts/` 中。

## 开发

```bash
npm ci
npm run typecheck   # 校验 TypeScript
npm test            # 运行 Vitest 测试
npm run build       # 构建 Chrome 和 Firefox
npm run zip         # 构建并生成两个压缩包
npm run check       # typecheck + 测试 + 构建
npm run clean       # 删除 dist/ 和 artifacts/
```

单独构建某个浏览器：

```bash
npm run build:chrome
npm run build:firefox
```

测试覆盖 URL 匹配、设置归一化、DOM 辅助函数、模块目录、X 状态补丁和 YouTube 解锁器。

### CI 与发布

- `.github/workflows/ci.yml` 在推送到 `main`、拉取请求和手动运行时执行 typecheck、测试、构建和压缩包生成。压缩包会作为 workflow artifact 保留 14 天。
- `.github/workflows/release.yml` 在推送 `v*` 标签时运行。它会检查标签是否与 `package.json` 版本一致，验证项目，生成压缩包，并发布包含两个包的 GitHub Release。

发布新版本：

```bash
npm version patch   # 或 minor / major
git push
git push --tags
```

`npm version` 创建的标签（例如 `v1.0.1`）会触发发布工作流。标签版本必须与 `package.json` 版本一致。

## 工作原理

```text
src/
  core/              类型、设置、浏览器 API、URL 匹配、DOM、提示
  modules/
    catalog.ts       弹窗和后台使用的模块目录
    registry.ts      各模块的 setup 注册表
    <site>/
      module.json    元数据、匹配规则、Cookie 和页面脚本选项
      index.ts       模块 setup（内容脚本）
      page.ts        可选：在 MAIN world 中运行的脚本
  content/index.ts   内容脚本入口
  background/index.ts Cookie 应用
  popup/             设置界面
scripts/build.mjs    构建、生成 manifest 和打包
tests/               单元测试
```

1. 构建过程读取每个 `src/modules/*/module.json`，校验元数据，并生成 Chrome 和 Firefox 的 manifest。
2. 内容脚本根据当前 URL 识别模块，只运行对应模块的 `setup`。
3. 带有 `pageScript` 的模块会额外获得一个在 MAIN world 中运行的脚本。这是拦截页面自身对象所必需的（X 和 YouTube）。
4. 后台在安装、启动、导航和设置变化时通过 `chrome.cookies` 应用 Cookie。
5. 弹窗将偏好设置保存到 `chrome.storage.local`；内容脚本和后台会实时响应变化。
6. `<html>` 上的 `data-fav-<id>` 属性会告诉 MAIN world 脚本模块是否启用，因为它们无法直接访问扩展存储。
7. X 和 Bluesky 的页面脚本会在应用渲染之前于内存中规范化 API 数据。这是仅限 Firefox 的 `webRequest` 响应过滤的跨浏览器替代方案。

### 添加网站

1. 创建 `src/modules/<id>/module.json`，包含 `id`、`name`、`description` 和 `matches`。
2. 创建 `src/modules/<id>/index.ts`，导出 `setup(ctx: ContentContext)`。
3. 在 `src/modules/catalog.ts` 和 `src/modules/registry.ts` 中注册模块。
4. 如果网站需要 MAIN world 拦截，请在 `module.json` 中添加 `pageScript`、`pageMatches`、`pageRunAt`，必要时添加 `pageAllFrames`。
5. 为任何纯逻辑添加测试，并运行 `npm run check`。

`module.json` 支持的字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一标识符，使用小写字母、数字和连字符 |
| `name`、`description` | 弹窗中显示的文本 |
| `matches` | 内容脚本 URL 模式和主机权限 |
| `order`、`color`、`category` | 弹窗排序和外观 |
| `cookies` | 后台应用的 Cookie 规则 |
| `pageScript` | MAIN world 脚本路径，相对于模块目录 |
| `pageMatches` | MAIN world URL 模式（默认：`matches`） |
| `pageRunAt` | `document_start`、`document_end` 或 `document_idle` |
| `pageAllFrames` | 在 iframe 中运行 MAIN world 脚本 |

### 兼容性

- Chrome 及衍生浏览器：Manifest V3，`minimum_chrome_version` 111。
- Firefox：Manifest V3，`strict_min_version` 128，这是使用 `world: "MAIN"` 内容脚本所必需的。
- manifest 由构建过程生成；不要编辑 `dist/` 中的文件。

## 隐私

- 设置仅存储在浏览器的 `chrome.storage.local` 中。
- 该扩展没有分析、遥测、广告或自有服务器。
- Cookie 只会写入模块声明的域名（Reddit 和 Steam）。
- X 和 Bluesky 脚本只修改内存中的 API 数据，不会将数据发送到任何地方。
- YouTube 脚本会调用 YouTube 自己的 `/youtubei/v1/player` 端点，使用页面中已有的 API key 和会话，以获取不受限制的播放器响应。该扩展不会让数据离开 YouTube。
- 请求的权限：`storage`、`cookies` 和 `activeTab`，以及受支持网站的主机权限。

## 限制

- **服务器端验证无法移除。** 如果网站要求证件、信用卡、自拍、已验证账户或 API 侧确认，扩展无法绕过。
- **网站经常变化。** 选择器、开关名称和端点可能随时失效。受影响的模块需要更新。
- **X、Bluesky 和 YouTube 是最脆弱的模块。** 它们依赖页面、API 和播放器的内部细节，这些细节可能随时变化。
- **地区、账户和登录限制仍然有效。** 扩展不会创建账户、绕过地理封锁或移除登录要求。
- **Firefox：** 未经过 Mozilla 签名时只能临时安装；最低版本为 128。
- **Chromium：** 由于 Manifest V3 和 `world: "MAIN"`，最低版本为 111。
- **未上架应用商店。** 安装包由 CI 生成，并作为未签名版本发布。
- **不绕过 DRM。** 扩展不会下载、解密或重新分发内容。
- **你仍需对所访问的内容负责。**

## 法律声明

本扩展仅供个人和教育用途，在你自己的浏览器中、在你获准访问的网站上使用。它可能违反某些网站的服务条款，使用风险由你自行承担。作者不对滥用、账户封禁或法律后果负责。请勿使用该扩展访问非法内容，或绕过法律要求的年龄验证。

## 贡献

欢迎贡献，尤其是新模块和选择器修复。

- 使用英文 [Conventional Commits](https://www.conventionalcommits.org/)，例如 `feat: add example module` 或 `fix: update reddit age gate selector`。
- 尽可能将每个更改隔离在相关模块中。
- 打开拉取请求前运行 `npm run check`。
- 报告 bug 时，请提供浏览器、扩展版本、确切 URL 和复现步骤。

## 致谢

按网站拆分模块的思路受到 [helloyanis/age-verification-bypass](https://github.com/helloyanis/age-verification-bypass) 的启发，尤其是其 Reddit shadow DOM 处理、X 推文结果规范化和 Bluesky 标签改写。本项目不复制该项目代码；而是使用跨浏览器的 Manifest V3 架构（内容脚本 + MAIN world 补丁）实现这些思路，而不是仅限 Firefox 的 `webRequest` 拦截。

## 许可证

[MIT](LICENSE)

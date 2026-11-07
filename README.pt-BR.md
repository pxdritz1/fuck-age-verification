# Fuck Age Verification

[English](README.md) | **Português** | [中文](README.zh-CN.md)

[![CI](https://github.com/pxdritz1/fuck-age-verification/actions/workflows/ci.yml/badge.svg)](https://github.com/pxdritz1/fuck-age-verification/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/pxdritz1/fuck-age-verification)](https://github.com/pxdritz1/fuck-age-verification/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Extensão de navegador que remove verificações de idade client-side, avisos de conteúdo sensível e overlays 18+ em sites populares.

> **Importante:** a extensão só altera o que o site faz dentro do navegador. Verificações de idade feitas no servidor — envio de documento, cartão de crédito, selfie ou confirmação de conta — não podem ser contornadas por uma extensão. Veja [Limitações](#limitações).

## Sumário

- [O que a extensão faz](#o-que-a-extensão-faz)
- [Reddit e X em detalhe](#reddit-e-x-em-detalhe)
- [Sites suportados](#sites-suportados)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [Como funciona](#como-funciona)
- [Privacidade](#privacidade)
- [Limitações](#limitações)
- [Aviso legal](#aviso-legal)
- [Contribuindo](#contribuindo)
- [Agradecimentos](#agradecimentos)
- [Licença](#licença)

## O que a extensão faz

- Pula avisos de idade e overlays 18+ implementados no navegador.
- Mantém cookies de confirmação de idade em sites que usam esse mecanismo (Reddit e Steam).
- Remove avisos de conteúdo sensível clicando automaticamente em botões como "Ver post", "Continuar" e "Tenho 18 anos".
- Desbloqueia vídeos com restrição de idade no YouTube.
- Desativa o fluxo de verificação de idade do X no estado carregado pela página.
- Relaxa os avisos de conteúdo sensível do Bluesky e desativa a configuração client-side de age assurance.
- Permite ligar e desligar a extensão inteira ou cada site individualmente pelo popup.
- Funciona em navegadores Chromium (Chrome, Edge, Brave, Opera, Vivaldi) e Firefox.

A extensão não faz requisições a servidores próprios, não coleta telemetria e não envia dados de navegação para terceiros. Veja [Privacidade](#privacidade).

## Reddit e X em detalhe

Estes são os dois casos mais perceptíveis no uso diário.

### Reddit: o interstitial 18+

Ao abrir um subreddit NSFW, o Reddit pode mostrar uma página `/over18` ou um modal "maior de 18" antes de exibir a comunidade. O módulo do Reddit:

1. grava o cookie `over18=1` para `.reddit.com` (pelo background e por `document.cookie` como fallback);
2. na página `/over18`, marca a opção "sim" e envia o formulário automaticamente;
3. caso contrário, clica no botão ou texto do age gate, como "Yes, I'm over 18", "Continue", "View community" ou "Enter";
4. esconde os containers de promoção/upsell NSFW do Reddit, remove o prompt dentro do shadow DOM, libera o scroll da página e tira o blur dos containers de mídia sensível.

Isso remove o interstitial client-side. **Não** contorna exigência de login do Reddit, configuração de conteúdo adulto da conta ou qualquer decisão tomada pelos servidores do Reddit.

### X: avisos de mídia sensível

Quando um post contém mídia sensível, o X borra a imagem e mostra um aviso como "This media may contain sensitive content" com um botão **View**. O módulo do X:

1. altera as feature flags client-side do X em `__INITIAL_STATE__`, `JSON.parse`, `Response.prototype.json` e `Object.assign` — incluindo `sensitive_tweet_warnings_enabled` e `rweb_mvr_blurred_media_interstitial_enabled` — para que o aviso tenha menos chance de ser renderizado;
2. se o aviso ainda aparecer, clica automaticamente em **View**, **Show**, **See post** ou **Continue** dentro do aviso ou diálogo;
3. também desativa as flags client-side do fluxo de age assurance (`rweb_age_assurance_flow_enabled` e `age_verification_gate_enabled`);
4. normaliza wrappers `TweetWithVisibilityResults`, limpa `possibly_sensitive` e interstitials de perfil, e trata tweets citados, para que os próprios dados da API não escondam mais a mídia.

Isso resolve o fluxo de "clicar para revelar a imagem sensível". **Não** contorna verificação de idade no servidor, checagem de identidade ou restrições de conta. O X muda o estado interno com frequência, então este é o módulo com maior chance de precisar de atualizações.

## Sites suportados

| Site | O que é tratado | Estratégia |
| --- | --- | --- |
| Reddit | Interstitial 18+ e página `/over18` | Cookie `over18`, envio de formulário e cliques no age gate |
| X (Twitter) | Avisos de mídia sensível e fluxo client-side de age assurance | Patch de feature flags no MAIN world e cliques automáticos |
| YouTube | Vídeos com restrição de idade e avisos de conteúdo | Unlocker via InnerTube, reescrita de requisições e cliques |
| Instagram | Avisos de conteúdo sensível | Cliques em "Ver post", "Continuar" etc. |
| Facebook | Age gates e avisos de conteúdo sensível | Cliques automáticos |
| Threads | Avisos de conteúdo sensível | Cliques automáticos |
| Bluesky | Avisos de conteúdo sensível e configuração de age assurance | Reescrita em memória das respostas da API do Bluesky e cliques automáticos |
| TikTok | Avisos de conteúdo sensível e de idade | Cliques automáticos |
| Twitch | Aviso de conteúdo adulto | Cliques automáticos |
| Discord | Canais com restrição de idade no Discord Web | Cliques automáticos |
| Steam | Age gates da loja e da comunidade | Cookies, preenchimento de formulário e cliques |

Os seletores e fluxos de cada site ficam isolados em `src/modules/<site>/`. Quando um site muda o HTML, normalmente só o módulo correspondente precisa de ajuste.

## Instalação

### Releases

Baixe o pacote mais recente na página de [releases](https://github.com/pxdritz1/fuck-age-verification/releases):

- `fuck-age-verification-chrome-vX.Y.Z.zip`
- `fuck-age-verification-firefox-vX.Y.Z.zip`

**Chrome, Edge, Brave, Opera e Vivaldi**

1. Extraia o zip do Chrome.
2. Abra `chrome://extensions` (ou `edge://extensions`).
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta extraída.
5. Fixe a extensão na barra de ferramentas, se quiser.

**Firefox**

1. Extraia o zip do Firefox.
2. Abra `about:debugging#/runtime/this-firefox`.
3. Clique em **Carregar add-on temporário**.
4. Selecione o arquivo `manifest.json` da pasta extraída.

O Firefox remove add-ons temporários ao fechar o navegador. Para instalação permanente, o pacote precisa ser assinado pela Mozilla (AMO); este projeto não publica uma versão assinada.

### Build local

Requisitos: Node.js 20 ou superior e npm.

```bash
npm ci
npm run build
```

Os builds ficam em `dist/chrome` e `dist/firefox`. Para gerar os zips:

```bash
npm run zip
```

Os arquivos são criados em `artifacts/`.

## Desenvolvimento

```bash
npm ci
npm run typecheck   # valida TypeScript
npm test            # executa os testes com Vitest
npm run build       # gera Chrome e Firefox
npm run zip         # gera os dois zips
npm run check       # typecheck + testes + build
npm run clean       # remove dist/ e artifacts/
```

Builds individuais:

```bash
npm run build:chrome
npm run build:firefox
```

Os testes cobrem o matching de URLs, a normalização de configurações, os helpers de DOM, o catálogo de módulos, o patch de estado do X e o unlocker do YouTube.

### CI e releases

- `.github/workflows/ci.yml` roda typecheck, testes, build e geração dos zips em pushes para `main`, pull requests e execuções manuais. Os zips ficam disponíveis como artifact por 14 dias.
- `.github/workflows/release.yml` roda ao enviar uma tag `v*`. Ele verifica se a tag corresponde à versão do `package.json`, valida o projeto, gera os zips e publica um GitHub Release com os dois pacotes.

Para lançar uma versão:

```bash
npm version patch   # ou minor / major
git push
git push --tags
```

A tag criada por `npm version` (`v1.0.1`, por exemplo) dispara o workflow de release. A versão da tag precisa ser igual à versão do `package.json`.

## Como funciona

```text
src/
  core/              tipos, settings, browser API, matching de URL, DOM, toast
  modules/
    catalog.ts       catálogo usado pelo popup e pelo background
    registry.ts      registro dos setups de cada módulo
    <site>/
      module.json    metadados, matches, cookies e scripts de página
      index.ts       setup do módulo (content script)
      page.ts        opcional: script no MAIN world
  content/index.ts   entrada do content script
  background/index.ts aplicação de cookies
  popup/             interface de configurações
scripts/build.mjs    build, geração de manifest e zips
tests/               testes unitários
```

1. O build lê cada `src/modules/*/module.json`, valida os metadados e gera os manifests de Chrome e Firefox.
2. O content script identifica o módulo pela URL atual e executa apenas o `setup` correspondente.
3. Módulos com `pageScript` recebem um script adicional no MAIN world, necessário para interceptar objetos da própria página (X e YouTube).
4. O background aplica cookies via `chrome.cookies` nas instalações, inicializações, navegações e mudanças de configuração.
5. O popup grava as preferências em `chrome.storage.local`; content scripts e background reagem às mudanças em tempo real.
6. Um atributo `data-fav-<id>` no `<html>` informa aos scripts do MAIN world se o módulo está ativo, já que eles não têm acesso direto ao storage da extensão.
7. Os scripts de página do X e do Bluesky normalizam os dados da API em memória antes de o app renderizá-los. Essa é a alternativa cross-browser ao filtro de respostas `webRequest`, que existe apenas no Firefox.

### Adicionar um site

1. Crie `src/modules/<id>/module.json` com `id`, `name`, `description` e `matches`.
2. Crie `src/modules/<id>/index.ts` exportando `setup(ctx: ContentContext)`.
3. Registre o módulo em `src/modules/catalog.ts` e em `src/modules/registry.ts`.
4. Se o site exigir interceptação no MAIN world, adicione `pageScript`, `pageMatches`, `pageRunAt` e, se necessário, `pageAllFrames` ao `module.json`.
5. Adicione testes para qualquer lógica pura e rode `npm run check`.

Campos aceitos no `module.json`:

| Campo | Descrição |
| --- | --- |
| `id` | Identificador único em minúsculas, números e hífens |
| `name`, `description` | Texto exibido no popup |
| `matches` | Padrões de URL do content script e host permissions |
| `order`, `color`, `category` | Ordenação e aparência no popup |
| `cookies` | Regras de cookies aplicadas pelo background |
| `pageScript` | Caminho do script MAIN world, relativo ao módulo |
| `pageMatches` | Padrões de URL do script MAIN world (padrão: `matches`) |
| `pageRunAt` | `document_start`, `document_end` ou `document_idle` |
| `pageAllFrames` | Executa o script MAIN world em iframes |

### Compatibilidade

- Chrome e derivados: Manifest V3, `minimum_chrome_version` 111.
- Firefox: Manifest V3, `strict_min_version` 128, necessário para content scripts com `world: "MAIN"`.
- Os manifests são gerados pelo build; não edite arquivos dentro de `dist/`.

## Privacidade

- As configurações ficam apenas em `chrome.storage.local` no seu navegador.
- A extensão não possui analytics, telemetria, anúncios ou servidor próprio.
- Cookies só são gravados nos domínios declarados nos módulos (Reddit e Steam).
- Os scripts do X e do Bluesky apenas alteram dados da API em memória; eles não enviam dados para lugar nenhum.
- O script do YouTube consulta o endpoint `/youtubei/v1/player` do próprio YouTube, usando a API key e a sessão já presentes na página, para obter uma resposta de player sem restrição de idade. Nenhum dado sai do YouTube por causa da extensão.
- Permissões solicitadas: `storage`, `cookies` e `activeTab`, além de host permissions para os sites suportados.

## Limitações

- **Verificação no servidor não pode ser removida.** Se o site exige documento, cartão de crédito, selfie, conta verificada ou confirmação feita pela API, a extensão não tem como contornar isso.
- **Sites mudam com frequência.** Seletores, nomes de flags e endpoints podem quebrar sem aviso. O módulo afetado precisa ser atualizado.
- **X, Bluesky e YouTube são os módulos mais frágeis.** Eles dependem de detalhes internos da página, da API e do player, que podem mudar a qualquer momento.
- **Restrições de região, conta e login continuam valendo.** A extensão não cria conta, não contorna geobloqueio e não remove exigências de login.
- **Firefox:** a instalação é temporária sem assinatura da Mozilla; a versão mínima é 128.
- **Chromium:** a versão mínima é 111 por causa do Manifest V3 e do `world: "MAIN"`.
- **Não há publicação em lojas.** Os pacotes são gerados pelo CI e distribuídos como releases não assinados.
- **Não há bypass de DRM.** A extensão não baixa, descriptografa nem redistribui conteúdo.
- **O conteúdo acessado continua sendo de responsabilidade do usuário.**

## Aviso legal

Esta extensão é fornecida apenas para uso pessoal e educacional, no seu próprio navegador, em sites que você tem permissão para acessar. Ela pode violar os Termos de Serviço de alguns sites, e o uso é por sua conta e risco. Os autores não se responsabilizam por uso indevido, suspensões de conta ou consequências legais. Não use a extensão para acessar conteúdo ilegal ou para contornar verificações de idade exigidas por lei.

## Contribuindo

Contribuições são bem-vindas, especialmente novos módulos e correções de seletores.

- Use [Conventional Commits](https://www.conventionalcommits.org/) em inglês, por exemplo `feat: add example module` ou `fix: update reddit age gate selector`.
- Mantenha cada mudança isolada no módulo correspondente quando possível.
- Rode `npm run check` antes de abrir um pull request.
- Para bugs, informe navegador, versão da extensão, URL exata e passos para reproduzir.

## Agradecimentos

A abordagem por site foi inspirada em [helloyanis/age-verification-bypass](https://github.com/helloyanis/age-verification-bypass), especialmente no tratamento de shadow DOM do Reddit, na normalização de tweets do X e na reescrita de labels do Bluesky. Este projeto não copia aquele código; ele implementa as ideias com uma arquitetura Manifest V3 cross-browser (content scripts + patches no MAIN world) em vez do bloqueio `webRequest` exclusivo do Firefox.

## Licença

[MIT](LICENSE)

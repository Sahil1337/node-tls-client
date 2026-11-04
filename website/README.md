<div align="center">
  <h1>node-tls-client docs</h1>
  <p>The documentation site for node-tls-client: Fumadocs on Next.js, exported as static HTML.</p>
  <p><b><a href="https://sahil1337.github.io/node-tls-client/">Live site</a></b></p>
</div>

Pages are MDX files in `content/docs/`. Code samples, option tables and the changelog are never copied into them: the build reads them from the library's own `examples/`, `src/types/` and `CHANGELOG.md`, so the docs can't drift from the code.

## Quick start

Requires Node.js 20.9 or newer (CI uses 24). From `website/`:

```sh
npm install
npm run dev   # http://localhost:3000/ (built pages live under /node-tls-client/)
```

| Command               | What it does                                                                      |
| --------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`         | Dev server with hot reload.                                                       |
| `npm run build`       | Static site in `out/`. Fails on a broken `<include>` or an MDX error.             |
| `npm run preview`     | Serves `out/` under `/node-tls-client/`, the way GitHub Pages does (macOS/Linux). |
| `npm run types:check` | Type-checks the site's own code.                                                  |

The library doesn't need to be installed or built: the site reads its source files as text.

## Where content comes from

| Source                               | Shown as                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `content/docs/**/*.mdx`              | The pages. Sidebar order and sections are in `content/docs/meta.json` (and `reference/meta.json`).                            |
| `../examples/{basic,advanced}/*.mjs` | Every code block, pulled in with `<include>`.                                                                                 |
| `../src/types/*.ts`                  | Field tables (name, type, description), generated from the JSDoc by `<PropTable>`. Fix wording in the JSDoc, not on the page. |
| `../CHANGELOG.md`                    | The Changelog page, as-is. GitHub alerts such as `> [!IMPORTANT]` become callouts (`lib/remark-changelog.mjs`).               |

Some API docs are written by hand: the method and property tables in the **Sessions** and **Responses** guides, the options tables in **Requests** and **SessionOptions**, and the **ClientIdentifier** and **Types** pages. When a method, option, response field, browser profile or enum value changes in `src/`, update them too.

## Writing a page

Start with frontmatter. `description` appears under the title, in search results and on the page's link-preview image:

```mdx
---
title: Cookies
description: The session cookie jar, sending your own cookies, and reading what was set.
---
```

Then add the page to `content/docs/meta.json`, or it won't show in the sidebar.

### Code samples

Don't paste code into a page. Put it in an example, mark a region, and include that region:

```js
// examples/basic/cookies.mjs
//#region jar
const session = new Session();
await session.get("https://httpbin.org/cookies/set/theme/dark");
//#endregion
```

```mdx
<include cwd lang="js">
  ../examples/basic/cookies.mjs#jar
</include>
```

The path is relative to `website/` (that's what `cwd` means). Add `meta='title="app.mjs"'` to give the code block a filename. Examples are complete scripts that import `node-tls-client` the way user code does, so every snippet on the site can be run.

### Components

Available on every page without an import:

| Component                                                           | Use for                                                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `<Callout type="warn" title="…">`                                   | Warnings and notes. `type`: `info` (default), `warn`, `error`, `success`.                 |
| `<Tabs items={["ESM", "CommonJS"]}>`                                | Alternatives side by side; one `<Tab value="ESM">` per item.                              |
| `<Steps>` / `<Step>`                                                | Numbered procedures.                                                                      |
| `<Cards>` / `<Card href="…" title="…">`                             | Grids of links, as on the home page.                                                      |
| `<PropTable path="../src/types/native.ts" name="InitTLSOptions" />` | A flat table of one interface's fields, from `src/types`. A wrong `name` fails the build. |

## Checking your changes

```sh
npm run build   # from website/: every page and include compiles
```

The build only proves that each included file exists. The code itself is checked in CI: the `examples` job in `.github/workflows/ci.yml` runs every example against live servers on each push and pull request, retrying a failure once, and skips files marked `// docs:no-run` (ones that need a real proxy).

To run an example yourself, from the repo root:

```sh
npm run build                           # the examples use the local build
ln -s .. node_modules/node-tls-client   # once: lets them import "node-tls-client"
cd examples && node basic/cookies.mjs
```

## Publishing

`.github/workflows/docs.yml` builds the site on every pull request that touches `website/`, `src/types/`, `examples/`, `CHANGELOG.md` or the workflow itself, as a check. Publishing is manual: **Actions → Docs → Run workflow** on `main` builds the site and deploys it to GitHub Pages.

The `/node-tls-client` URL prefix is defined once, in `lib/base-path.mjs`. To build for another path, such as a fork, set `PAGES_BASE_PATH`:

```sh
PAGES_BASE_PATH=/my-fork npm run build
```

## Also served

- **For AI tools:** `/llms.txt`, `/llms-full.txt`, and a Markdown copy of each page at `/llms.mdx/docs/<page>/content.md`.
- **Link previews:** a generated Open Graph image per page, from its title and description.
- **Old URLs:** links to the old TypeDoc pages (e.g. `classes/Session.html`) land on the 404 page, which forwards to the new page using `lib/typedoc-redirects.ts`. Add an entry there when a page moves.

## Project structure

```
website/
├── app/            routes: pages, search API, llms.txt, OG images, the 404 redirect
├── components/     MDX components (callout, …), search dialog, sidebar footer
├── content/docs/   the pages and their meta.json sidebars
├── lib/            content source, base path, changelog plugin, TypeDoc redirects
└── next.config.mjs static export, base path, Turbopack root (the repo, for ../ reads)
```

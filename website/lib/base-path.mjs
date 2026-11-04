// The only source of the site's URL prefix. next.config reads it and passes
// it on as NEXT_PUBLIC_BASE_PATH for the search client and lib/shared.ts.
//
// GitHub Pages serves this project at sahil1337.github.io/node-tls-client/,
// so built pages need that prefix. `next dev` serves at the root of
// localhost instead; `npm run preview` reproduces the prefixed site.
export const basePath =
  process.env.PAGES_BASE_PATH ??
  (process.env.NODE_ENV === "development" ? "" : "/node-tls-client");

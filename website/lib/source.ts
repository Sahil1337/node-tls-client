import { llms, loader } from "fumadocs-core/source";
import { docsContentRoute, docsImageRoute, docsRoute } from "./shared";
import { applyMdxPreset } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/macro";
import { remarkChangelog } from "./remark-changelog.mjs";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    mdxOptions: applyMdxPreset({
      // The changelog page includes ../CHANGELOG.md, whose old entries link
      // images that no longer exist; drop those instead of failing the build.
      remarkImageOptions: { onError: "hide" },
      // First, so heading ids and the TOC see the demoted changelog headings.
      remarkPlugins: (defaults) => [remarkChangelog, ...defaults],
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText("processed")}`,
});

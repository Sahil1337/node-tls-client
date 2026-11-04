import { createGetUrl } from "fumadocs-core/source";

export const appName = "node-tls-client";
export const docsRoute = "/";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "Sahil1337",
  repo: "node-tls-client",
  branch: "main",
};

// Next applies basePath to <Link> and routing only; URLs that end up in
// fetch() calls or metadata need it added by hand.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "content.md"];

  return { segments, url: basePath + getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "image.png"];

  return { segments, url: basePath + getImageUrl(segments, page.locale) };
}

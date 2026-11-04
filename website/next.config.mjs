import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import { basePath } from "./lib/base-path.mjs";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
  // The repo root, not website/: pages <include> ../examples/** and the type
  // tables read ../src/types/*, and Turbopack refuses files outside its root.
  turbopack: { root: fileURLToPath(new URL("..", import.meta.url)) },
  reactStrictMode: true,
};

export default withMDX(config);

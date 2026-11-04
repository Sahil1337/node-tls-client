"use client";
import { useEffect } from "react";
import { typedocRedirects } from "@/lib/typedoc-redirects";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** On the 404 page: forwards an old TypeDoc URL to its new page. */
export function TypedocRedirect() {
  useEffect(() => {
    const path = location.pathname
      .slice(basePath.length)
      .replace(/^\/|\.html$/g, "");
    const target = typedocRedirects[path];
    if (target) location.replace(basePath + target);
  }, []);
  return null;
}

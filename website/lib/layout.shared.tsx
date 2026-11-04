import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName } from "./shared";

// GitHub, npm and the theme toggle live in components/sidebar-footer.tsx:
// Fumadocs' own footer row leaves a wide gap between icons and the toggle.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {appName}
          {/* Latest published version, fetched by the browser, so it never
              goes stale between docs deploys. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://img.shields.io/npm/v/node-tls-client?label=&style=flat-square&color=555"
            alt="Latest version on npm"
            height={18}
            className="rounded-sm"
          />
        </>
      ),
    },
    themeSwitch: { enabled: false },
  };
}

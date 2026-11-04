import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider } from "@/components/provider";
import "./global.css";

export const metadata: Metadata = {
  // Origin only: page metadata URLs already carry the base path (lib/shared.ts).
  metadataBase: new URL("https://sahil1337.github.io"),
  title: { template: "%s | node-tls-client", default: "node-tls-client" },
  description:
    "Node.js HTTP client that impersonates real browser TLS fingerprints.",
};

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

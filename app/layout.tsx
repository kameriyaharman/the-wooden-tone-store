import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/noto-serif-devanagari/500.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { getSettings } from "@/lib/settings";
import { NavProgress } from "@/components/nav-progress";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const st = await getSettings().catch(() => null);
  return {
    title: { default: st?.seoTitle || "The Wooden Tone", template: `%s · ${st?.storeName || "The Wooden Tone"}` },
    description: st?.seoDescription,
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    icons: { icon: "/seed/logo-square.png" },
  };
}
export const viewport: Viewport = { themeColor: "#2A1F17", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense><NavProgress /></Suspense>
        {children}
      </body>
    </html>
  );
}

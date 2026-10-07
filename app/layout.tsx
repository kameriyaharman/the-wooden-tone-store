import "./globals.css";
import type { Metadata, Viewport } from "next";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const st = await getSettings().catch(() => null);
  return {
    title: { default: st?.seoTitle || "The Wooden Tone", template: `%s · ${st?.storeName || "The Wooden Tone"}` },
    description: st?.seoDescription,
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    icons: { icon: "/seed/logo.jpg" },
  };
}
export const viewport: Viewport = { themeColor: "#3A2411", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

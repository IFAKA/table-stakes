import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/app/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table Stakes",
  description: "Heads-up Hold'em for one deck and one phone.",
  applicationName: "Table Stakes",
  appleWebApp: { capable: true, title: "Table Stakes", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", colorScheme: "dark", themeColor: "#000000" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><ServiceWorkerRegistration />{children}</body></html>;
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Table Stakes — Heads-up Hold'em",
    short_name: "Table Stakes",
    description: "A local tabletop controller for two-player physical-card Hold'em.",
    id: "/",
    start_url: "/",
    scope: "/",
    lang: "en",
    categories: ["games", "utilities"],
    display: "standalone",
    orientation: "any",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

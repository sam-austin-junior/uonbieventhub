import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UoN Event Hub",
    short_name: "UoN Events",
    description:
      "The official multi-tenant event management platform for the University of Nairobi.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#174776",
    orientation: "portrait-primary",
    icons: [
      { src: "/uon-logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/uon-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/uon-logo.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}

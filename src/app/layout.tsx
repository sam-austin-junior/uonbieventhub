import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UoN Event Hub",
  description:
    "The official multi-tenant event management platform for the Unity of Nations.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/uon-logo.png", type: "image/png", sizes: "any" },
    ],
    apple: "/uon-logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "UoN Events",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#174776",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

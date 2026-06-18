import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UoN Event Hub",
  description:
    "The official multi-tenant event management platform for the University of Nairobi.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/uon-logo.png", type: "image/png", sizes: "any" },
    ],
    apple: "/uon-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

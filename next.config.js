/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Event organizers can paste logo/cover URLs from any source, so we
    // accept any HTTPS host (and HTTP for legacy organizer-supplied URLs
    // that haven't been migrated yet). next/image still validates that
    // the response is actually an image before serving.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdf-lib"],
  },
};

module.exports = nextConfig;

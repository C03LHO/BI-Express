import type { NextConfig } from "next";

// GitHub Pages hosts static files only. We export and prefix with the repo name.
// Locally (pnpm dev / pnpm build without the env var), basePath stays empty.
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "BI-Express";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isPages ? `/${repo}` : "",
  assetPrefix: isPages ? `/${repo}/` : "",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Turbopack build is fine for static export. No server features used.
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : "",
  },
};

export default nextConfig;

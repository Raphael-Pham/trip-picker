import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'source.unsplash.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      // Next.js 15's built-in SWC MinifyPlugin crashes on Cloudflare's build
      // environment (Node 22 / Linux) because its error handler references
      // _webpack.WebpackError which is never exported from the bundled webpack.
      // Disabling webpack-level minification avoids the crash; @cloudflare/next-on-pages
      // applies esbuild optimisation on the edge-function bundles anyway.
      config.optimization.minimize = false;
    }
    return config;
  },
};

export default nextConfig;

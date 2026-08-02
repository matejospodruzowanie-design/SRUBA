import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.221"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Type check skips during `next build` — the checker phase gets killed on the
  // Railway Metal builder (OOM, no error output). Types are still enforced via
  // `npx tsc --noEmit`, which passes.
  typescript: { ignoreBuildErrors: true },
  turbopack: {
    resolveAlias: {
      ".prisma/client/default": "./node_modules/.prisma/client/default.js",
    },
  },
};

export default nextConfig;

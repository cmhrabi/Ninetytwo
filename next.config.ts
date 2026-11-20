import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Route handlers read these folders with fs at runtime. Vercel only ships files the
  // tracer can see, so list them explicitly.
  outputFileTracingIncludes: {
    "/api/*": ["./rubric/**/*", "./samples/**/*", "./cache/**/*"],
  },
  // Packages that must stay as plain Node requires on the server (not bundled).
  serverExternalPackages: ["unpdf", "mammoth"],
};

export default nextConfig;

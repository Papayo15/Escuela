import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/**": ["./data/temario/**/*", "./data/temas/**/*"],
  },
};

export default nextConfig;

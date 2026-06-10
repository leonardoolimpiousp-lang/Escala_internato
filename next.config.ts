import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fixa a raiz no projeto (há outro lockfile no home do usuário).
    root: __dirname,
  },
};

export default nextConfig;

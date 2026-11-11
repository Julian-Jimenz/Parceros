import type { NextConfig } from "next";

/** Fuera de la raíz `.next` en OneDrive suele reducir errores EINVAL/readlink en Windows. */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? "node_modules/.cache/mer-next",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async rewrites() {
    return [
      // URLs cosméticas <sección>/dashboard: sirven el inicio de la sección
      { source: "/jugador/dashboard", destination: "/jugador" },
      { source: "/coach/dashboard", destination: "/coach" },
    ];
  },
};

export default nextConfig;

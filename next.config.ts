import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que el dev server responda desde la LAN (app Capacitor en el celular).
  allowedDevOrigins: ["192.168.18.24", "192.168.*"],
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

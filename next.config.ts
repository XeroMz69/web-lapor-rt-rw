import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  allowedDevOrigins: ["nas.xero", "localhost:3000", "sipenacivil.adamyd.my.id", "sipena-civil.adamyd.workers.dev"],
};

export default nextConfig;

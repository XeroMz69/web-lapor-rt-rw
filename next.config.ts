import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  allowedDevOrigins: ["nas.xero", "localhost:3000"],
};

export default nextConfig;

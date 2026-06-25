import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['struk.bydils.site','struk.socialmedia.my.id','localhost:3000', 'struk-fahmi.bydils.site'],
    },
  },
};

export default nextConfig;

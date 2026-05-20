import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "preview-chat-902c81ea-8f47-487e-9a4e-bb8361ad278c.space-z.ai",
  ],
};

export default nextConfig;

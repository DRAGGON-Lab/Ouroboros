import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/DRAGGON-Lab/Ouroboros/main/docs/Ouroboros_logotype.png"
      }
    ]
  }
};

export default nextConfig;

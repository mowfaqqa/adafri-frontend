import type { NextConfig } from "next";

const url = new URL('https://lh3.googleusercontent.com/**')
const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{
      hostname: url.hostname,
      protocol: "https",
      search: url.search,
      pathname: url.pathname,
    } ],
  },
};

export default nextConfig;

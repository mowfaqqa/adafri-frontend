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
  env: {
    "CLIENT_ID": "i2SjHtoM56UruLqUWd41rigI",
    "AUTHORIZATION_ENDPOINT": "https://accounts.adafri.app/o/v1/authorize",
    "TOKEN_ENDPOINT": "https://api.adafri.dev/oauth2/v1/token",
    "USERINFO_ENDPOINT": "https://accounts.adafri.app/me"
  }
};

export default nextConfig;

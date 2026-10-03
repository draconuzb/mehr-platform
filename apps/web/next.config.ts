import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(self), microphone=(self)" },
];

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mehr/shared"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Service worker yangilanishi keshda qolib ketmasligi uchun
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default config;

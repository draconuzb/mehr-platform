import type { NextConfig } from "next";

// Xodimlar paneli: qidiruv tizimlari indekslamaydi, iframe'ga qo'yib bo'lmaydi.
// Production'da VPN/IP allowlist + 2FA orqasida turadi (qaror #20).
const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default config;

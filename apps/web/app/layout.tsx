import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mehr",
  description: "Yangi shaharda ikkinchi oilang bor",
  appleWebApp: { capable: true, title: "Mehr", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0E6B75",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      {/* Brauzer kengaytmalari body ga atribut qo'shadi — faqat shu darajadagi atribut farqini e'tiborsiz qoldiramiz */}
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

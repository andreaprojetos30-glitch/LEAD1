import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { Shell } from "@/components/Shell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "ELEVA | Captação de Leads",
  description: "Captação de leads da ELEVA em feiras, congressos e ações comerciais.",
  applicationName: "ELEVA Leads",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "ELEVA Leads",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a2b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full antialiased">
        <PwaRegister />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

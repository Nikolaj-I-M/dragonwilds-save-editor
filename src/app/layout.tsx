import type { Metadata } from "next";
import { Alegreya_Sans, Cinzel } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-cinzel",
});

const alegreya = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-alegreya",
});

export const metadata: Metadata = {
  title: "Dragonwilds Save Editor",
  description:
    "Free, open-source save editor for RuneScape: Dragonwilds. Edit your inventory, character name, health and stamina — 100% in the browser.",
  icons: { icon: "/assets/theme/dragon_visage.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${alegreya.variable}`}>
      <body>{children}</body>
    </html>
  );
}

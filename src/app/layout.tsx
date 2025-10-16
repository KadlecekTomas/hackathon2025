import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KHK Explore | Poznej Královéhradecký kraj",
    template: "%s | KHK Explore",
  },
  description:
    "Interaktivní mapa Královéhradeckého kraje s cyklotrasami, přírodou a památkami. Plánujte výlety, ukládejte oblíbené tipy a objevte nové zážitky.",
  openGraph: {
    title: "KHK Explore – interaktivní průvodce Královéhradeckým krajem",
    description:
      "Prozkoumejte cyklotrasy, přírodní krásy i památky v jediné mapě. Filtry, oblíbené položky a chytré tipy pro vaše výlety.",
    url: "https://khk-explore.example.com",
    siteName: "KHK Explore",
    locale: "cs_CZ",
    type: "website",
  },
  metadataBase: new URL("https://khk-explore.example.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-mesh-light`}
      >
        {children}
      </body>
    </html>
  );
}

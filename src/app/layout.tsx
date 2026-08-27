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
  metadataBase: new URL("https://asset-simulator-one.vercel.app"),
  title: "資産額シミュレーター",
  description:
    "毎月の積立額や想定利回りから、将来の資産額をかんたんにシミュレーション。比較・逆算・取り崩し計画にも対応。",
  openGraph: {
    title: "資産額シミュレーター",
    description:
      "毎月の積立額や想定利回りから、将来の資産額をかんたんにシミュレーション。",
    url: "/",
    siteName: "資産額シミュレーター",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "資産額シミュレーター",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "資産額シミュレーター",
    description:
      "毎月の積立額や想定利回りから、将来の資産額をかんたんにシミュレーション。",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import Providers from "../providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solyd - DeFi Dashboard",
  description: "Discover and participate in various DeFi protocols on Solana",
  keywords: ["DeFi", "Solana", "Jupiter", "Yield Farming", "Lending"],
  authors: [{ name: "Solyd Team" }],
  creator: "Solyd",
  publisher: "Solyd",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://solyd.app",
    title: "Solyd - DeFi Dashboard",
    description: "Discover and participate in various DeFi protocols on Solana",
    siteName: "Solyd",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Solyd Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solyd - DeFi Dashboard",
    description: "Discover and participate in various DeFi protocols on Solana",
    images: ["/android-chrome-512x512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

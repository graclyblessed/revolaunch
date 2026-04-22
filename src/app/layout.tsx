import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Revolaunch - The Evolution of Startup Launching",
  description: "Discover, launch, and fund the most innovative startups. Revolaunch is the next-generation platform for founders, investors, and tech enthusiasts.",
  keywords: ["Revolaunch", "startup", "launch", "Product Hunt alternative", "startup directory", "fundraising", "investors"],
  authors: [{ name: "Revolaunch" }],
  openGraph: {
    title: "Revolaunch - The Evolution of Startup Launching",
    description: "Discover, launch, and fund the most innovative startups worldwide.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revolaunch",
    description: "The evolution of startup launching",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

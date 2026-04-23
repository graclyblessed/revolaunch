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
  title: "Revolaunch - Where Startups Begin",
  description: "Get funded. Get acquired. Get seen. Discover, launch, and fund the most innovative startups on the next-generation startup directory.",
  keywords: ["Revolaunch", "startup", "launch", "Product Hunt alternative", "startup directory", "fundraising", "investors", "weekly leaderboard"],
  authors: [{ name: "Revolaunch" }],
  openGraph: {
    title: "Revolaunch - Where Startups Begin",
    description: "Get funded. Get acquired. Get seen. The next-generation startup directory.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revolaunch",
    description: "Where startups begin.",
  },
  icons: {
    icon: "/favicon.ico",
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

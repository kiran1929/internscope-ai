import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InternScope AI | Never Miss Your Dream Tech Internship Again",
  description: "Monitor internship openings from top tech companies, get personalized match scores, receive daily email alerts, and prepare for interviews.",
  keywords: ["internship tracker", "tech internships", "software engineer intern", "AI resume score", "google step", "stripe internship", "interview prep"],
  authors: [{ name: "InternScope Team" }],
  openGraph: {
    title: "InternScope AI",
    description: "Personalized tech internship tracking platform.",
    type: "website",
    locale: "en_US",
  },
};

import CookieConsent from "@/components/CookieConsent";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeToaster } from "@/components/ThemeToaster";
import { ThemeScript } from "@/components/ThemeScript";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${outfit.variable} dark h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <ThemeScript />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
          <ThemeProvider>
            {children}
            <ThemeToaster />
            <CookieConsent />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

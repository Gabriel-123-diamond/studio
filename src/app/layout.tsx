
"use client"; // Root layout is a client component to manage client-side state like theme

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from 'react';
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Meal Villa</title>
        <meta name="description" content="Your personalized culinary journey." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {isClient ? (
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        ) : (
          // Render children directly on the server and initial client render without ThemeProvider
          // This avoids the ThemeProvider script causing hydration mismatch.
          // A flash of unstyled content for theme might occur briefly.
          <>
            {children}
          </>
        )}
      </body>
    </html>
  );
}

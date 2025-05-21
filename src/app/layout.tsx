
"use client"; 

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Note: The static `metadata` export was removed because this is a Client Component.
// Next.js disallows exporting `metadata` from components marked with "use client".

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
    <html lang="en">
      <head>
        <title>Meal Villa</title>
        <meta name="description" content="Your personalized culinary journey." />
        <link rel="icon" href="/favicon.ico" sizes="any" /> {/* Ensure favicon is linked */}
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true} // Added to help with potential body attribute mismatches
      >
        {children}
        {isClient && <Toaster />} {/* Render Toaster only on client-side after mount */}
      </body>
    </html>
  );
}

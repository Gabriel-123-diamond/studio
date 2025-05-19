
"use client"; // Added because we are using hooks

// import type {Metadata} from 'next'; // Metadata type import is no longer needed here
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { useState, useEffect } from 'react'; // Added

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
// To set metadata for the root layout, alternative strategies would be needed
// if this component must remain client-side (e.g. for the Toaster).

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false); // Added state

  useEffect(() => { // Added effect
    setIsClient(true);
  }, []);

  return (
    <html lang="en">
      <head>
        {/* You can manually add title and meta tags here if needed,
            or use next/head for more dynamic client-side updates,
            though the App Router prefers metadata exports from Server Components. */}
        <title>Meal Villa</title>
        <meta name="description" content="Your personalized culinary journey." />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        {isClient && <Toaster />} {/* Modified to render Toaster only on client */}
      </body>
    </html>
  );
}

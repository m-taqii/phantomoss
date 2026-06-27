import type { Metadata } from "next";
import { Syne, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phantom - Autonomous Protocol",
  description: "B2B client acquisition weaponized swarm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="flex flex-col overflow-x-hidden w-full max-w-[100vw] min-h-screen bg-black text-white">
        <div className="scanline" />
        <Toaster>
          {children}
        </Toaster>
      </body>
    </html>
  );
}

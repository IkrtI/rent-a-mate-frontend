import type { Metadata } from "next";
import { DM_Mono, Fraunces, Manrope } from "next/font/google";

import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

const manrope = Manrope({ display: "swap", subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ display: "swap", subsets: ["latin"], variable: "--font-display" });
const dmMono = DM_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Rent a Mate",
  description: "Rent a Mate frontend foundation",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable} ${dmMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

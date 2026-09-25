import type { Metadata } from "next";
import Script from "next/script";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"),
  title: { default: "matefor. — Good company, thoughtfully connected", template: "%s | matefor." },
  description:
    "Find a local mate for coffee, games, study, and the little plans that are better together.",
  openGraph: {
    title: "matefor. — Good company, thoughtfully connected",
    description: "Find a local mate for your next plan.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable} ${dmMono.variable}`}>
        <Script id="theme-preference" strategy="beforeInteractive">
          {`try { const cookie = document.cookie.split("; ").find((item) => item.startsWith("matefor-theme="))?.split("=")[1]; let saved = cookie; try { saved = localStorage.getItem("matefor-theme") || cookie; } catch {} const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.classList.toggle("dark", dark); document.documentElement.style.colorScheme = dark ? "dark" : "light"; } catch {}`}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

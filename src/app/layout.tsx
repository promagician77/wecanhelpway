import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { ToastProvider } from "@/components/ui/feedback";
import { RouteProgress } from "@/components/ui/route-progress";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-display",
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "WeCanHelpWay — Someone out there can help. We find them for you.",
    template: "%s · WeCanHelpWay",
  },
  description:
    "Tell us what you need — even if you can't name it yet. A real person on our team finds someone who can help, and opens a private conversation once you both agree.",
  keywords: ["help", "mentorship", "community", "matching", "support", "collaboration"],
  openGraph: {
    type: "website",
    siteName: "WeCanHelpWay",
    title: "WeCanHelpWay — Someone out there can help.",
    description:
      "Tell us what you need. A real person finds someone who can help. You both agree before anyone talks.",
    url: SITE,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${display.variable}`}>
      <body className="min-h-dvh antialiased">
        <RouteProgress />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

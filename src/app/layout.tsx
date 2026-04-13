import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Providers from "~/app/_components/Providers";
import Navbar from "./_components/global/layout/navbar/Navbar";
import ServiceWorkerRegistration from "./_components/ServiceWorkerRegistration";
import Footer from "./_components/global/layout/Footer";
import { CookieConsent } from "./_components/global/CookieConsent";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getHeadInjection } from "~/lib/headInjection";
import HeadInjection from "./_components/HeadInjection";

export const metadata: Metadata = {
  title: "Audio Marker",
  description:
    "Audio Marker - Upload, mark, and share your audio files with ease. By DRaab",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Audio Marker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Audio Marker",
    title: "Audio Marker",
    description: "Upload, mark, and share your audio files with ease",
  },
  twitter: {
    card: "summary",
    title: "Audio Marker",
    description: "Upload, mark, and share your audio files with ease",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const headInjection = await getHeadInjection();

  return (
    <html lang={locale} className={`${geist.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/audio-marker-logo.svg" />
      </head>
      <body>
        <Providers>
          <NextIntlClientProvider>
            <ServiceWorkerRegistration />
            {headInjection && <HeadInjection html={headInjection} />}
            <Navbar />
            <TRPCReactProvider>
              <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-4 w-full max-w-full overflow-x-hidden">
                {children}
              </main>
            </TRPCReactProvider>
            <Footer />
            <CookieConsent />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}

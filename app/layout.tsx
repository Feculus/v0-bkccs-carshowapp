import type React from "react"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "2025 CRUISERFEST SHOW-N-SHINE",
  description:
    "The premier Land Cruiser showcase bringing together enthusiasts, collectors, and the most extraordinary vehicles from around the world. Register your vehicle for the 2025 CRUISERFEST Show-N-Shine.",
  keywords: [
    "car show",
    "automotive showcase",
    "vehicle registration",
    "CRUISERFEST",
    "Show-N-Shine",
    "classic cars",
    "car enthusiasts",
    "automotive event",
    "vehicle voting",
    "car competition",
  ],
  authors: [{ name: "Land Cruiser Heritage Museum" }],
  creator: "Land Cruiser Heritage Museum",
  publisher: "Land Cruiser Heritage Museum",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cruiserfest-show-n-shine.vercel.app",
    siteName: "2025 CRUISERFEST SHOW-N-SHINE",
    title: "2025 CRUISERFEST SHOW-N-SHINE",
    description:
      "The premier Land Cruiser showcase bringing together enthusiasts, collectors, and the most extraordinary vehicles from around the world. Register your vehicle for the 2025 CRUISERFEST Show-N-Shine.",
    images: [
      {
        url: "https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Green%20Cruiser.jpg",
        width: 1200,
        height: 630,
        alt: "2025 CRUISERFEST SHOW-N-SHINE - Classic green cruiser car",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2025 CRUISERFEST SHOW-N-SHINE",
    description:
      "The premier Land Cruiser showcase bringing together enthusiasts, collectors, and the most extraordinary vehicles from around the world.",
    images: ["https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Green%20Cruiser.jpg"],
    creator: "@LandCruiserHeritage",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://cruiserfest-show-n-shine.vercel.app",
  },
  category: "automotive",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/FavIcon.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/FavIcon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/FavIcon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/FavIcon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#BF6849" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CRUISERFEST 2025" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#BF6849" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <Header />
            <main>{children}</main>
            <Footer />
            <ScrollToTop />
            <Analytics />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}

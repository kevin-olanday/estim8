import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/app/context/notification-context"
import "./styles/theme.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EstiM8 - Agile Planning Poker",
  description: "Real-time collaborative Planning Poker for agile teams",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Basic SEO */}
        <title>EstiM8 - Agile Planning Poker</title>
        <meta name="description" content="Real-time Planning Poker for agile teams. Plan smarter, together." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
        {/* Favicon & Manifest */}
        <link rel="icon" href="/v9/favicon.ico" />
        <link rel="icon" type="image/png" sizes="96x96" href="/v9/favicon-96x96.png" />
        <link rel="icon" type="image/svg+xml" href="/v9/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/v9/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Open Graph Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="EstiM8 - Agile Planning Poker" />
        <meta property="og:description" content="Real-time Planning Poker for agile teams. Plan smarter, together." />
        <meta property="og:image" content="/v9/web-app-manifest-512x512.png" />
        <meta property="og:url" content="https://estim8.app" />
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="EstiM8 - Agile Planning Poker" />
        <meta name="twitter:description" content="Real-time Planning Poker for agile teams. Plan smarter, together." />
        <meta name="twitter:image" content="/v9/web-app-manifest-512x512.png" />
        {/* PWA / iOS Web App Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EstiM8" />
        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'EstiM8',
          url: 'https://estim8.app',
          description: 'Real-time Planning Poker for agile teams. Plan smarter, together.',
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'All',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          image: 'https://estim8.app/v9/web-app-manifest-512x512.png',
        }) }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <NotificationProvider>
            <main>
              <div>
                {children}
              </div>
              <footer className="fixed left-0 bottom-0 w-full border-t border-border bg-background py-4 flex justify-center items-center text-sm text-muted-foreground z-50">
                <span className="flex items-center gap-2">
                  Designed and developed with
                  <span className="text-pink-400">❤️</span>
                  by
                  <a
                    href="https://KevinOlanday.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 px-3 py-1 rounded-full font-bold text-sm bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow hover:brightness-110 transition border border-accent/40"
                  >
                    Kevin Olanday
                  </a>
                </span>
              </footer>
            </main>
            <Toaster />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/app/context/notification-context"
import "./styles/theme.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "EstiM8 - Agile Planning Poker",
  description: "Real-time collaborative Planning Poker for agile teams",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>EstiM8 - Agile Planning Poker</title>
        <meta name="description" content="Real-time Planning Poker for agile teams. Plan smarter, together." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Kevin Olanday" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="icon" href="/v9/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className + " flex flex-col md:min-h-screen"}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <NotificationProvider>
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <footer className="w-full border-t border-border bg-background py-4 flex justify-center items-center text-sm text-muted-foreground z-50">
              <span className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 w-full px-2 text-center">
                <span className="flex items-center gap-1 flex-wrap justify-center">
                  Designed and developed with
                  <span className="text-pink-400">❤️</span>
                  by
                </span>
                <a
                  href="https://KevinOlanday.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto mt-1 md:mt-0 px-3 py-1 rounded-full font-bold text-sm bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow hover:brightness-110 transition border border-indigo-200 text-center"
                >
                  Kevin Olanday
                </a>
              </span>
            </footer>
            <Toaster />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

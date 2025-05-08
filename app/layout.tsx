import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/app/context/notification-context"
import "./styles/theme.css"

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <NotificationProvider>
            <main className="flex flex-col min-h-screen">
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
                {children}
              </div>
              <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
                {/* Footer content will go here in a later step */}
              </footer>
            </main>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

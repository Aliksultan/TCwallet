import type { Metadata } from 'next'
import { AppProvider } from '@/lib/app-context'
import '@/app/globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Tulga Community | TC Wallet',
  description: 'Tulga Community internal wallet and T-Market platform',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#070B12" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>
        <AppProvider>
          <div id="app-shell">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  )
}

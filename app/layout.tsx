import type { Metadata, Viewport } from 'next'
import { Montserrat, Noto_Sans_Armenian } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ChatWidgetProvider } from '@/contexts/ChatWidgetContext'
import ChatWidget from '@/components/Chat/ChatWidget'

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})
const notoArmenian = Noto_Sans_Armenian({
  subsets: ['armenian'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto-armenian',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Homy - Find Your Perfect Home',
  description: 'Real estate platform for finding your dream property',
  icons: {
    icon: [
      { url: '/logo/homy_icon_16px.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/logo/homy_icon_24px.svg', sizes: '24x24', type: 'image/svg+xml' },
      { url: '/logo/homy_icon_40px.svg', sizes: '40x40', type: 'image/svg+xml' },
    ],
    apple: '/logo/homy_icon_80px.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${notoArmenian.variable}`}>
      <body className="font-body">
        <Providers>
          <ChatWidgetProvider>
            {children}
            <ChatWidget />
          </ChatWidgetProvider>
        </Providers>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { MockSessionProvider } from '@/lib/mock/session'
import { ToastProvider } from '@/components/ui'

export const metadata: Metadata = {
  title: 'PULSE — The heartbeat of your team',
  description: 'Jera Consulting HR & People Operations Portal',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <MockSessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MockSessionProvider>
      </body>
    </html>
  )
}

import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hoodie Academy - Crypto X Influence',
  description: 'Learn how to build your influence in the crypto space on X',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  )
}

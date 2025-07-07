import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bill Tracker',
  description: 'Created by humblx',
  generator: 'humblx',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Demo Video Generator - AI-Powered Demo Videos in Minutes',
  description: 'Automated demo video creation for GitHub projects. $20 per video, 5-minute turnaround. Perfect for hackathons, startups, and open source.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-purple-900 via-violet-900 to-black text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}

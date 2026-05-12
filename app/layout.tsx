import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PaperCraft - School Exam Generator',
  description: 'AI-powered school paper generator for Indian schools',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&family=Literata:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

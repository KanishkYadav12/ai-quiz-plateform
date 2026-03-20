import './globals.css'
import ReduxProvider from '@/components/layout/ReduxProvider'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'QuizAI — Real-time Multiplayer Quiz Platform',
  description: 'AI-generated quizzes, real-time multiplayer, live leaderboards',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ReduxProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }
            }}
          />
        </ReduxProvider>
      </body>
    </html>
  )
}

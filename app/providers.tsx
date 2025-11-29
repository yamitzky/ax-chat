'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { SessionRepositoryContext } from '@/lib/session/repository'
import { chatSessionRepository } from '@/features/chat/infrastructure/chat-session-repository'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionRepositoryContext.Provider value={chatSessionRepository}>
      {children}
      </SessionRepositoryContext.Provider>
    </QueryClientProvider>
  )
}

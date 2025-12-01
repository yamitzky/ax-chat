'use client'

import { ChatRepositoryProvider, DexieChatRepository } from '@/features/chat/repositories/chat-repository'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ChatRepositoryProvider value={new DexieChatRepository()}>
        {children}
      </ChatRepositoryProvider>
    </QueryClientProvider>
  )
}

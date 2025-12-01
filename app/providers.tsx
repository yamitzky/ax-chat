"use client"

import {
  ChatRepositoryProvider,
  DexieChatRepository,
} from "@/features/chat/repositories/chat-repository"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChatRepositoryProvider value={new DexieChatRepository()}>
      {children}
    </ChatRepositoryProvider>
  )
}

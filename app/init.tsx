"use client"
import { useEffect } from "react"
import { useChatSessionOperations } from "@/features/chat/operations/use-chat-session-operations"
import "./globals.css"

export function InitZustand({ children }: { children: React.ReactNode }) {
  const { initialize } = useChatSessionOperations()
  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}

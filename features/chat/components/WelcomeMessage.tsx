"use client"

import { Bot } from "lucide-react"

export function WelcomeMessage() {
  return (
    <div className="text-center text-muted-foreground py-10 text-sm">
      <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
      <p>Hello! I am your AI assistant.</p>
      <p>Ask me anything to get started.</p>
    </div>
  )
}

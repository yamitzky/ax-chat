'use client'

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useChat } from "../hooks/facade/use-chat"
import { ChatHeader } from "./ChatHeader"
import { ChatInput } from "./ChatInput"
import { ChatMessages } from "./ChatMessages"
import { SessionSidebar } from "./SessionSidebar"

type Props = {
  sessionId?: string | null;
};

export default function Chat({ sessionId = null }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { messages, inputValue, setInputValue, isLoading, handleSend, llmProvider, handleProviderChange } = useChat({
    sessionId,
    useWebSearch: true,
  });

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SessionSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200",
        sidebarOpen && "md:ml-64"
      )}>
        <Card className="flex-1 flex flex-col shadow-xl border-zinc-200 dark:border-zinc-800 bg-card/50 backdrop-blur-sm rounded-none md:rounded-lg md:m-4 md:h-[calc(100vh-2rem)] overflow-hidden">
          <ChatHeader
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            provider={llmProvider}
            onProviderChange={handleProviderChange}
          />

          <ChatMessages
            messages={messages}
            isLoading={isLoading}
          />

          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            onSubmit={handleSend}
          />
        </Card>
      </div>
    </div>
  );
}

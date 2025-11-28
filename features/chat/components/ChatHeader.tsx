'use client'

import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AVAILABLE_PROVIDERS, type LLMProvider } from "@/lib/model-types"
import { Bot, Menu } from "lucide-react"

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  provider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
};

export function ChatHeader({ onToggleSidebar, provider, onProviderChange }: Props) {
  return (
    <CardHeader className="flex-row items-center justify-between border-b p-4 bg-muted/30">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg">AI Chat Assistant</span>
        </CardTitle>
      </div>
      <Select value={provider} onValueChange={(value: LLMProvider) => onProviderChange(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select LLM Provider" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_PROVIDERS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardHeader>
  );
}

'use client'

import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AVAILABLE_PROVIDERS, type LLMProvider } from "@/lib/ai/providers"
import { Bot, Menu } from "lucide-react"

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  provider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
};

export function ChatHeader({ onToggleSidebar, provider, onProviderChange }: Props) {
  return (
    <CardHeader className="!flex !flex-row items-center justify-between border-b px-3 py-2 bg-muted/30">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleSidebar}>
          <Menu className="w-4 h-4" />
        </Button>
        <CardTitle className="flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">AI Chat</span>
        </CardTitle>
      </div>
      <Select value={provider} onValueChange={(value: LLMProvider) => onProviderChange(value)}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Select Provider" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_PROVIDERS.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardHeader>
  );
}

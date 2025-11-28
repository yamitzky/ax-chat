'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ThinkingDisplayProps {
  thinking: string
  isStreaming?: boolean
}

export function ThinkingDisplay({ thinking, isStreaming }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!thinking && !isStreaming) return null

  // 最後の行を取得（プレビュー用）
  const lines = thinking.split('\n').filter(line => line.trim())
  const lastLine = lines[lines.length - 1] || thinking

  return (
    <div className="border-l-2 border-purple-500/30 pl-3 my-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 mr-1" />
        ) : (
          <ChevronRight className="w-3 h-3 mr-1" />
        )}
        <Sparkles className="w-3 h-3 mr-1" />
        {isExpanded ? 'Thinking' : lastLine}
      </Button>

      {isExpanded && (
        <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap pl-6">
          {thinking}
          {isStreaming && (
            <span className="inline-block w-1 h-3 ml-1 bg-purple-500/50 animate-pulse" />
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  title: string
  onSave: (newTitle: string) => void
  onCancel: () => void
}

export function SessionTitleEditor({ title, onSave, onCancel }: Props) {
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave(value)
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(value)}
      className="w-full px-1 rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
    />
  )
}

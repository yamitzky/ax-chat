import { useEffect, useRef } from "react"

export function useScrollToBottom(dependencies: React.DependencyList) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
    // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies is explicitly passed as an array
  }, dependencies)

  return messagesEndRef
}

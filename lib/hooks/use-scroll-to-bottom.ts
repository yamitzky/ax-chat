import { useEffect, useRef } from "react"

export function useScrollToBottom(dependencies: React.DependencyList) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return messagesEndRef
}

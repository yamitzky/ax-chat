import { useCallback, useRef } from "react"

/**
 * メッセージ送信時のスクロール戦略:
 * - ユーザーがメッセージを送信したとき、そのメッセージがビューポートの上部に来るようにスクロール
 * - ストリーミング中は自動スクロールしない（ユーザーが読んでいる位置を維持）
 */
export function useScrollToMessage() {
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * 特定のメッセージIDの要素をビューポート上部にスクロール
   */
  const scrollToMessage = useCallback((messageId: string) => {
    if (!containerRef.current) return

    const messageElement = containerRef.current.querySelector(
      `[data-message-id="${messageId}"]`,
    )

    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  /**
   * 最下部にスクロール（従来の動作、必要な場合用）
   */
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return

    const scrollArea = containerRef.current.closest(
      "[data-radix-scroll-area-viewport]",
    )
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [])

  return {
    containerRef,
    scrollToMessage,
    scrollToBottom,
  }
}

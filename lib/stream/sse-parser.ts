/**
 * SSEイベントをパースするTransformStream
 */
export function createSSEParser<T>() {
  return new TransformStream<string, T>({
    transform(rawEvent: string, controller) {
      const lines = rawEvent
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith(':')) // コメント無視

      const dataLines = lines
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice('data:'.length).trim())

      if (dataLines.length === 0) return

      const data = dataLines.join('\n')

      if (data === '[DONE]') {
        controller.terminate()
        return
      }

      try {
        controller.enqueue(JSON.parse(data))
      } catch {
        // パース失敗は無視
      }
    },
  })
}

/**
 * SSEイベント境界で分割するTransformStream
 */
export function createEventSplitter() {
  let buffer = ''
  return new TransformStream<string, string>({
    transform(chunk: string, controller) {
      buffer += chunk
      const events = buffer.split('\n\n')
      buffer = events.pop()! // 最後の不完全イベントは残す
      for (const e of events) controller.enqueue(e)
    },
    flush(controller) {
      if (buffer) controller.enqueue(buffer)
    },
  })
}

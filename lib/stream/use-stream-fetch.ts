import { useCallback, useState } from "react"
import type { z } from "zod"
import { createEventSplitter, createSSEParser } from "./sse-parser"

/**
 * SSEストリーミングHTTPリクエストを扱う汎用hook
 */
export function useStreamFetch<TResponse>(
  responseSchema: z.ZodType<Partial<TResponse>>,
) {
  const [controller, setController] = useState<AbortController | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const fetchStream = useCallback(
    async (
      responsePromise: Promise<Response>,
      options?: {
        onStream?: (
          delta: Partial<TResponse>,
          accumulated: TResponse,
        ) => void | Promise<void>
      },
    ) => {
      if (controller) controller.abort()
      const newController = new AbortController()
      setController(newController)
      setIsStreaming(true)

      try {
        const response = await responsePromise

        if (!response.body) {
          throw new Error("No response body")
        }

        // SSEパーサーのパイプライン
        const stream = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(createEventSplitter())
          .pipeThrough(createSSEParser<Partial<TResponse>>())

        let accumulated: Record<string, unknown> = {}

        // ReadableStreamをAsyncIterableに変換
        for await (const chunk of stream) {
          if (newController.signal.aborted) break
          const parsed = responseSchema.parse(chunk)
          accumulated = mergeDeep(accumulated, parsed)
          await options?.onStream?.(parsed, accumulated as TResponse)
        }
        return accumulated as TResponse
      } finally {
        setController(null)
        setIsStreaming(false)
      }
    },
    [controller, responseSchema],
  )

  const abort = useCallback(() => {
    if (controller) {
      controller.abort()
    }
  }, [controller])

  return {
    fetchStream,
    isStreaming,
    abort,
    abortSignal: controller?.signal,
  }
}

function mergeDeep<T>(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): T {
  if (typeof target !== "object" || target === null) {
    return source as T
  }

  const result = { ...target }

  for (const key in source) {
    const targetValue = result[key]
    const sourceValue = source[key]

    if (typeof targetValue === "string" && typeof sourceValue === "string") {
      result[key] = targetValue + sourceValue
    } else if (
      typeof targetValue === "object" &&
      targetValue !== null &&
      typeof sourceValue === "object" &&
      sourceValue !== null
    ) {
      result[key] = mergeDeep(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      )
    } else {
      result[key] = sourceValue
    }
  }

  return result as T
}

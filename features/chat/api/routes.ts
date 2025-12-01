import { ax } from "@ax-llm/ax"
import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { getLlmClient } from "@/lib/ai/client"
import { type ChatResponseDelta, chatRequestSchema } from "./schemas"

export const chatRoutes = new Hono().post(
  "/chat",
  zValidator("json", chatRequestSchema),
  async (c) => {
    const { prompt, history, llmProvider, useWebSearch } = c.req.valid("json")

    const llm = getLlmClient(llmProvider, { useWebSearch })
    const chatter = ax(`history?:json[], question:string -> answer:string`)
    const abortController = new AbortController()

    return streamSSE(
      c,
      async (stream) => {
        // クライアント切断時の処理
        stream.onAbort(() => {
          abortController.abort("Client disconnected")
        })

        // ストリーミング実行
        const axStream = chatter.streamingForward(
          llm,
          { history, question: prompt },
          { showThoughts: true, abortSignal: abortController.signal },
        )

        for await (const chunk of axStream) {
          await stream.writeSSE({
            data: JSON.stringify(chunk.delta satisfies ChatResponseDelta),
            id: chunk.index.toString(),
          })
        }
      },
      async (_, stream) => {
        stream.write(JSON.stringify({ error: "Streaming failed" }) + "\n")
      },
    )
  },
)

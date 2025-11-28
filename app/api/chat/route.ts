import { ax } from '@ax-llm/ax'
import { getLlmClient } from '@/lib/ai-client'
import { LLMProvider } from '@/lib/model-types'
import { NextRequest } from 'next/server'

const encoder = new TextEncoder()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, provider = 'gemini-flash', useWebSearch = false } = body as {
      prompt: string
      provider?: LLMProvider
      useWebSearch?: boolean
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // LLMクライアントを取得
    const llm = getLlmClient(provider, { useWebSearch })

    // ax-llmのシグネチャを定義
    const chatter = ax(`question:string -> answer:string`)

    // ストリーミングレスポンスを作成
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // streamingForwardでストリーミング実行
          const axStream = chatter.streamingForward(llm, { question: prompt })

          for await (const chunk of axStream) {
            if (chunk.delta.answer) {
              // テキストをエンコードしてストリームに送信
              controller.enqueue(encoder.encode(chunk.delta.answer))
            }
          }

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

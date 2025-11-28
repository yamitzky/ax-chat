import { getLlmClient } from '@/lib/ai-client'
import { LLMProvider } from '@/lib/model-types'
import { ax } from '@ax-llm/ax'
import { NextRequest } from 'next/server'

const encoder = new TextEncoder()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, history = [], provider = 'gemini-flash', useWebSearch = false } = body as {
      prompt: string
      history?: Array<{ role: string; content: string }>
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

    // ax-llmのシグネチャを定義（historyを追加、showThoughtsでthoughtが自動追加される）
    const chatter = ax(`history?:json[], question:string -> answer:string`)

    // ストリーミングレスポンスを作成
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // streamingForwardでストリーミング実行（showThoughtsを有効化）
          const axStream = chatter.streamingForward(
            llm,
            { history, question: prompt },
            { showThoughts: true }
          )

          for await (const chunk of axStream) {
            // JSON Lines形式でdeltaをそのまま送信（answerとthoughtが含まれる）
            controller.enqueue(encoder.encode(JSON.stringify(chunk.delta) + '\n'))
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
        'Content-Type': 'application/x-ndjson; charset=utf-8',
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

import { z } from 'zod'

// LLMプロバイダーのzodスキーマ
export const llmProviderSchema = z.enum([
  'gemini-pro',
  'gemini-flash',
  'gemini-pro3',
  'sonnet',
  'opus',
  'haiku',
])

export type LLMProvider = z.infer<typeof llmProviderSchema>

// チャットリクエストスキーマ
export const chatRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  history: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ).optional().default([]),
  llmProvider: llmProviderSchema.optional(),
  useWebSearch: z.boolean().optional().default(false),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>

export const chatResponseDeltaSchema = z.object({
  answer: z.string().optional(),
  thought: z.string().optional(),
})

export type ChatResponseDelta = z.infer<typeof chatResponseDeltaSchema>

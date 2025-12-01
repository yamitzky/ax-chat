export const MODEL_MAP_KEYS = [
  "gemini-pro",
  "gemini-flash",
  "gemini-pro3",
  "sonnet",
  "opus",
  "haiku",
] as const

export type LLMProvider = (typeof MODEL_MAP_KEYS)[number]

export const AVAILABLE_PROVIDERS: LLMProvider[] = [...MODEL_MAP_KEYS]

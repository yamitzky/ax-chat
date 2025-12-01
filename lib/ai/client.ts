import { AxAIAnthropicVertexModel, AxAIGoogleGeminiModel, ai } from "@ax-llm/ax"
import { GoogleAuth } from "google-auth-library"
import { LLMProvider } from "./providers"

const googleAuth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
})

const getGoogleToken = async () => {
  const client = await googleAuth.getClient()
  const accessToken = await client.getAccessToken()
  if (!accessToken.token) {
    throw new Error("Failed to get Google token")
  }
  return accessToken.token
}

const MODEL_MAP = {
  "gemini-pro": AxAIGoogleGeminiModel.Gemini25Pro,
  "gemini-flash": AxAIGoogleGeminiModel.Gemini25Flash,
  "gemini-pro3": AxAIGoogleGeminiModel.Gemini3ProPreview,
  sonnet: AxAIAnthropicVertexModel.Claude45Sonnet,
  opus: AxAIAnthropicVertexModel.Claude41Opus,
  haiku: AxAIAnthropicVertexModel.Claude45Haiku,
}

export const getLlmClient = (
  provider: LLMProvider = "gemini-flash",
  options?: { useWebSearch?: boolean },
) => {
  switch (provider) {
    case "gemini-pro3":
    case "gemini-pro":
    case "gemini-flash":
      return ai({
        name: "google-gemini",
        apiKey: getGoogleToken,
        projectId: process.env.GOOGLE_PROJECT_ID,
        region: process.env.GOOGLE_LOCATION || "global",
        config: {
          model: MODEL_MAP[provider],
        },
        options: {
          googleSearch: !!options?.useWebSearch,
        },
      })

    case "sonnet":
    case "opus":
    case "haiku": {
      const webSearchTools = options?.useWebSearch
        ? [
            {
              type: "web_search_20250305" as const,
              name: "web_search",
            },
          ]
        : []
      return ai({
        name: "anthropic",
        apiKey: getGoogleToken,
        projectId: process.env.GOOGLE_PROJECT_ID,
        region: process.env.GOOGLE_LOCATION || "global",
        config: {
          model: MODEL_MAP[provider],
          tools: webSearchTools,
          maxTokens: provider === "opus" ? 32000 : undefined,
        },
      })
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

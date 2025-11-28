import type { LLMProvider } from "@/lib/model-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import type { Message } from "../types";

type CompletionOptions = {
  provider?: LLMProvider;
  useWebSearch?: boolean;
};

type StreamingResponse = {
  answer: string;
  thought?: string;
};

async function* getCompletion(
  prompt: string,
  history: Array<{ role: string; content: string }>,
  signal: AbortSignal,
  options?: CompletionOptions
) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      history,
      provider: options?.provider,
      useWebSearch: options?.useWebSearch,
    }),
    signal,
  });

  if (!response.body) throw new Error('No body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // バッファに追加
    buffer += decoder.decode(value, { stream: true });
    
    // 改行で分割してJSON行を処理
    const lines = buffer.split('\n');
    // 最後の不完全な行はバッファに保持
    buffer = lines.pop() || '';
    
    // 完全な行を処理
    for (const line of lines) {
      if (line.trim()) {
        yield line;
      }
    }
  }
  
  // 最後の残りを処理
  if (buffer.trim()) {
    yield buffer;
  }
}

export default function useStreamCompletion(options?: CompletionOptions) {
  const id = useId();
  const queryClient = useQueryClient();
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 単一のオブジェクトでstreamingResponseを管理
  const { data: streamingResponse } = useQuery<StreamingResponse>({
    queryKey: ["streaming-response", id],
    queryFn: () => ({ answer: "", thought: "" }),
    initialData: { answer: "", thought: "" },
    staleTime: Infinity,
    enabled: false,
  });

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationKey: ["mutate-completion", id],
    mutationFn: async ({ prompt, history }: { prompt: string; history: Message[] }) => {
      if (abortController) {
        abortController.abort();
      }
      const controller = new AbortController();
      const signal = controller.signal;
      setAbortController(controller);

      // キャッシュをクリア
      queryClient.setQueryData(["streaming-response", id], { answer: "", thought: "" });

      let fullAnswer = "";
      let fullThought = "";

      try {
        // historyをAPI形式に変換
        const apiHistory = history.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        for await (const token of getCompletion(
          prompt,
          apiHistory,
          signal,
          options,
        )) {
          try {
            const delta = JSON.parse(token);

            if (delta.answer) {
              fullAnswer += delta.answer;
            }

            if (delta.thought) {
              fullThought += delta.thought;
            }

            // オブジェクトごと更新
            queryClient.setQueryData<StreamingResponse>(
              ["streaming-response", id],
              { answer: fullAnswer, thought: fullThought || undefined }
            );
          } catch (parseError) {
            // JSONパースエラーは無視（不完全なデータの可能性）
            console.warn('Failed to parse JSON line:', parseError);
          }
        }
      } finally {
        setAbortController(null);
      }

      return { answer: fullAnswer, thought: fullThought || undefined };
    },
  });

  return {
    mutate,
    mutateAsync,
    completion: streamingResponse.answer,
    thinking: streamingResponse.thought,
    error,
    isLoading: isPending
  };
}
